function doGet(e) {
  var action = e.parameter.action;
  var boardId = e.parameter.boardId || "qamomath_mainframe";
  var scriptProperties = PropertiesService.getScriptProperties();
  
  if (action === "getCommsPayload") {
    var boardData = scriptProperties.getProperty(boardId) || "{}";
    var parsedBoard = JSON.parse(boardData);
    
    // Grab the latest audio file, if any exists, then drop it so it plays only once
    var audioData = scriptProperties.getProperty(boardId + "_audio") || "";
    if(audioData !== "") {
      scriptProperties.deleteProperty(boardId + "_audio");
    }
    
    var response = {
      pages: parsedBoard.pages || null,
      totalPages: parsedBoard.totalPages || 1,
      timestamp: parsedBoard.timestamp || 0,
      audioTransmission: audioData
    };
    
    return ContentService.createTextOutput(JSON.stringify(response))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var postData = JSON.parse(e.postData.contents);
  var scriptProperties = PropertiesService.getScriptProperties();
  var boardId = postData.boardId || "qamomath_mainframe";
  
  if (postData.action === "voiceTransmit") {
    // Stage the walkie talkie voice burst audio payload directly to RAM cache strings
    scriptProperties.setProperty(boardId + "_audio", postData.audio);
    return ContentService.createTextOutput(JSON.stringify({status: "TRANSMISSION_STAGED"}))
                         .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (postData.action === "saveBoard") {
    var boardState = {
      pages: postData.pages,
      totalPages: postData.totalPages,
      timestamp: postData.timestamp
    };
    scriptProperties.setProperty(boardId, JSON.stringify(boardState));
    return ContentService.createTextOutput(JSON.stringify({status: "BOARD_SAVED"}))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}