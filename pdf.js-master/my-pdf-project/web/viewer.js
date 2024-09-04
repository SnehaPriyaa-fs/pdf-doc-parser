// Load the PDF.js library
const pdfjsLib = window['pdfjs-dist/build/pdf'];

// Path to your PDF file
const url = '/pdf/exampleHeader.pdf'; // Path to the PDF file

// Global variables
let currPage = 1;
let numPages = 0;
let thePDF = null;

// Start processing the PDF document
pdfjsLib.getDocument({ url: url }).promise.then(function (pdf) {
    console.log('PDF loaded');
    thePDF = pdf; // Store the PDF globally
    numPages = pdf.numPages; // Get the number of pages in the PDF
    pdf.getPage(1).then(handlePages); // Start processing the first page
});

// Function to recursively traverse the structure tree and match content with text items
function matchStructureWithText(structElement, textItems) {
    let elements = [];

    if (!structElement || !textItems) return elements;

    // Check if the structure element has children
    if (structElement.children) {
        structElement.children.forEach(child => {
            // Check if the element is StructTreeNode or StructTreeContent
            if (child.type === "StructTreeNode" || child.type === "StructTreeContent") {
                if (child.role === "Span" && child.obj && child.obj.dict && child.obj.dict.get("Type").name === "StructElem") {
                    // Extract the text from the structure element (if available)
                    const structText = child.obj.str || '';

                    // Match the structure text with text items
                    const matchedItem = textItems.find(item => item.str === structText);
                    if (matchedItem) {
                        elements.push({
                            id: child.id,
                            bbox: matchedItem.transform, // Store the bounding box of the matched text
                            str: matchedItem.str // Store the text content of the matched item
                        });
                    }
                }

                // Recursively match the children of the current structure element
                elements = elements.concat(matchStructureWithText(child, textItems));
            }
        });
    }

    return elements;
}

// Function to handle each page
function handlePages(page) {
    const viewport = page.getViewport({ scale: 1.5 }); // Define the viewport with a scale of 1.5

    // Create a canvas to render the page
    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render the page onto the canvas
    page.render({ canvasContext: context, viewport: viewport }).promise.then(function () {
        console.log(`Page ${currPage} rendered`);

        // Extract the structure tree of the current page
        page.getStructTree().then(function (structTree) {
            // Check if the structure tree is available
            if (!structTree || !structTree.children || structTree.children.length === 0) {
                console.warn(`Page ${currPage}: The PDF you uploaded does not have a structure tree.`);
                return;
            }

            console.log(`Structure tree for Page ${currPage}:`, structTree);

            // Extract text content along with bounding boxes
            page.getTextContent().then(function (textContent) {
                // Match structure tree elements with text items and bounding boxes
                const matchedElements = matchStructureWithText(structTree, textContent.items);

                // Combine structure tree and matched elements (with bounding boxes and text) into one object
                const result = {
                    pageNum: currPage,
                    structureTree: structTree,
                    elements: matchedElements,
                    textContent : textContent
                };

                // Function to download JSON content
                function downloadJSON(content, fileName) {
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(
                        new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' })
                    );
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }

                // Save the result as a JSON file
                const fileName = `/page-${currPage}-structure-tree.json`;
                downloadJSON(result, fileName);
            }).catch(function (error) {
                console.error(`Error retrieving text content for Page ${currPage}:`, error);
            });
        }).catch(function (error) {
            console.error(`Error retrieving structure tree for Page ${currPage}:`, error);
        });

        // Add the canvas to the webpage
        document.body.appendChild(canvas);

        // Move to the next page
        currPage++;
        if (thePDF !== null && currPage <= numPages) {
            thePDF.getPage(currPage).then(handlePages); // Process the next page
        }
    }).catch(function (error) {
        console.error(`Error rendering page ${currPage}:`, error);
    });
}
