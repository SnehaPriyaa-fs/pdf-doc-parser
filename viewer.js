// PDF.js library setup
const url = '/pdf/example_tagged_PAC_WCAG_Report (2).pdf'; // Path to your PDF file

pdfjsLib.getDocument({ url: url }).promise.then(function (pdf) {
  console.log('PDF loaded');

  // Fetch the first page (for demo purposes, you can iterate through all pages)
  pdf.getPage(1).then(function (page) {
    console.log('Page loaded');

    const scale = 1.5;
    const viewport = page.getViewport({ scale: scale });

    // Prepare canvas using PDF page dimensions
    const canvas = document.getElementById('pdfCanvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render PDF page into canvas context
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    page.render(renderContext).promise.then(function () {
      console.log('Page rendered');

      // Extract the structure tree
      page.getStructTree().then(function (structTree) {
        console.log('Structure tree:', structTree);

        // Extract text content along with bounding boxes
        page.getTextContent().then(function (textContent) {
          const textItems = textContent.items.map(item => ({
            str: item.str,
            bbox: item.transform
          }));

          // Combine structure tree and bounding boxes into one object
          const result = {
            structureTree: structTree,
            textWithBBoxes: textItems
          };

          // Example function to download JSON
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

          // Save structure tree and bounding boxes as JSON
          downloadJSON(result, '/Users/fleetstudiotechnologies/Downloads/grobid_client_python-master/pdf.js/my-pdf-project/output-json/testSample-pdf-structure-tree.json');

        }).catch(function (error) {
          console.error('Error retrieving text content:', error);
        });

      }).catch(function (error) {
        console.error('Error retrieving structure tree:', error);
      });
    });
  });
}).catch(function (error) {
  console.error('Error processing PDF:', error);
});
