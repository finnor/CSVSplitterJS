"use strict";
function CSVSplitterJS(files) {
  let JSZip = require('jszip');
  let fileList = files;

  this.splitFiles = function (chunkSize) {
    let fileCount = fileList.length;
    let fileResolutionCount = 0;
    let splitCSVs = [];

    Array.from(fileList, function(file) {
      //validate
      let reader = new FileReader();
      let promise = Promise.resolve();
      reader.onloadend =
        () => promise.then(
          () => fileResolutionCount++
        ).then(
          () => checkIsFinished(fileResolutionCount, fileCount) ? doOnFinish(splitCSVs) : false
        );
      let promiseSuccess = Promise.resolve();
      reader.onload = () => promiseSuccess.then(() => splitCSVs.push({name: file.name.slice(0, -4), chunks: splitFile(reader)}));
      reader.readAsText(file)
    });
  }

  let checkIsFinished = function (resolvedFiles, totalFiles) {
    return(resolvedFiles===totalFiles)
  }

  let doOnFinish = function (splitCSVs) {
    let zip = new JSZip();
    let folder;
    //TODO use polyfill instead of data:app https://stuk.github.io/jszip/documentation/howto/write_zip.html
    //Convert array representation to JSZip
    for(let i=0; i<splitCSVs.length; i++) {
      folder = zip.folder(splitCSVs[i].name);
      for(let j=0; j<splitCSVs[i].chunks.length; j++) {
        folder.file(splitCSVs[i].name + "_" + j + ".csv", splitCSVs[i].chunks[j]);
      }
    }
    zip.generateAsync({type:"base64"}).then(function (base64) {
       location.href="data:application/zip;base64," + base64;
    });
    //create download zip after every file is resolved
  }

  let splitFile = function (fileReader) {
    let chunkSize = 2;
    //Set headers;
    let csvLines = fileReader.result.split("\n");

    let headers = [csvLines[0]];
    return chunk(csvLines, chunkSize).map(function(chunk) {
      return headers.concat(chunk).join("\n");
    });
  }

  let chunk = function (data, chunkSize = 1) {
    let chunked = [];
    for(let i=1; i<data.length; i+=chunkSize)
      chunked.push(data.slice(i, i+chunkSize));
    return chunked;
  }

  let validate = function (file) {
    let isCSV = false;
    if (file.type===('application/vnd.ms-excel') || file.type===('text/csv')) {
      isCSV = true;
    }
    return isCSV;
  }
}
module.exports = CSVSplitterJS;