"use strict";
/**
 * CSVSplitterJS class; takes input csvs and chunks
 * them, then generates a zip download
 *
 * @param {FileList} files  the files to be chunked
 */
function CSVSplitterJS(files) {
  let JSZip = require("jszip");
  let fileList = files;

  /**
   * Checks if all files have been chunked
   *
   * @param  {number} resolvedFiles  the number of filse chunked
   * @param  {number} totalFiles  the number of files requested to be chunked
   * @return {boolean}  have all files been chunked
   */
  let checkIsFinished = function (resolvedFiles, totalFiles) {
    return(resolvedFiles===totalFiles);
  };

  /**
   * Iterates over a file's data and returns the data
   * chunked into arrays
   *
   * @param  {string[]} data  the csv data as an array of rows
   * @param  {number} chunkSize  the size the data should be chunked into
   * @return {string[][]}  the chunked data
   */
  let chunk = function (data, chunkSize = 100) {
    let chunked = [];
    for(let i=1; i<data.length; i+=chunkSize) {
      chunked.push(data.slice(i, i+chunkSize));
    }
    return chunked;
  };

  /**
   * Chunks a single file's data
   *
   * @param  {FileReader} fileReader  the reader of the requested file
   * @param  {number} chunkSize  the size the data should be chunked into
   * @return {string[][]}  the chunked data for the file
   */
  let splitFile = function (fileReader, chunkSize) {
    //Set headers;
    let csvLines = fileReader.result.split("\n");

    let headers = [csvLines[0]];
    //Chunk the data and attach header to each file
    return chunk(csvLines, chunkSize).map(function(chunk) {
      return headers.concat(chunk).join("\n");
    });
  };

  /**
   * Validates that the file is a csv
   * TODO, there is an issue that csvs are sometimes
   * presented as text
   *
   * @param  {File} file  the file being validated
   * @return {boolean}  is the file a csv
   */
  let validate = function (file) {
    let isCSV = false;
    if (file.type===("application/vnd.ms-excel") || file.type===("text/csv")) {
      isCSV = true;
    }
    return isCSV;
  };

  /**
   * Writes the chunked csv data to a zip,
   * and creates a download link
   *
   * @param  {Object[]} splitCSVs  all the split data
   * @return {void}
   */
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
    //create download zip after every file is chunked
  };

  /**
   * Iterates over every file and chunks the file's data
   *
   * @param  {number} chunkSize  the size the data should be chunked into
   * @return {void}
   */
  this.splitFiles = function (chunkSize) {
    let fileCount = fileList.length;
    let fileResolutionCount = 0;
    let splitCSVs = [];

    Array.from(fileList, function(file) {
      //Should validate file here, but there is an unresolved issue
      //TODO validate

      let reader = new FileReader();
      let promise = Promise.resolve();
      reader.onloadend =
        () => promise.then(
          () => fileResolutionCount++
        ).then(
          () => checkIsFinished(fileResolutionCount, fileCount) ? doOnFinish(splitCSVs) : false
        );
      let promiseSuccess = Promise.resolve();
      reader.onload = () => promiseSuccess.then(() => splitCSVs.push({name: file.name.slice(0, -4), chunks: splitFile(reader, chunkSize)}));
      reader.readAsText(file);
    });
  };
}
module.exports = CSVSplitterJS;