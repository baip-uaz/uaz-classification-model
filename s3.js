var albumBucketName = "uaz-bucket";
var bucketRegion = "us-east-1";
var IdentityPoolId = "us-east-1:f4c18571-a422-4fb8-9a83-c68e3d21d68e";

AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
  })
});

var s3 = new AWS.S3({  
  signatureVersion: "v4",
  //apiVersion: "2006-03-01",
  params: { Bucket: albumBucketName }  
});

/************************************************* */
function listAlbums() {        
      s3.listObjects({ Bucket: albumBucketName, Delimiter: "/" }, function(err, data) {
      if (err) {
        return alert("There was an error listing your albums: " + err.message);
      } else {
        var albums = data.CommonPrefixes.map(function(commonPrefix) {
          var prefix = commonPrefix.Prefix;
          var albumName = decodeURIComponent(prefix.replace("/", ""));          
          if(albumName==='ANALYZE-DATASET') {
            return getHtml([
              "<button onclick=\"viewAndLoadDatasets('" + albumName + "')\" class='btn btn-danger btn-block btn-round'>",
              albumName,
              "</button>",              
            ]); 
          } else{
            return getHtml([
              ""
            ]);  
          }
        });
        var message = albums.length
          ? getHtml([
              "<p>This tool wants to help you to analyze structured datasets (Features and Models).</p>"+
              "<p><b>Considerations:</b>"+
                "<ul>"+
                  "<li>You can upload datasets in .csv format.</li>"+
                  "<li>The name of the target column must have the label: 'target'.</li>"+
                  "<li>The dataset must have a maximum size of 3MB.</li> "+
                  "<li>The time to have the result of the analysis is 1 hour </li>"+
                  "<li>To use the result model, you need to have it installed in a notebook: pip install auto-sklearn == 0.14.0 joblib == 1.1.0 pandas==1.3.4.</li>"+
                  "<li>For more information check our  <a href='https://docs.google.com/document/d/1xJ3HIgVNWuHVBUBUw5rH3cBZO9S3ZOBeakvHQnt9MNE/edit?usp=sharing'>USER MANUAL</a></li>"+
                "</ul>"+
              "</p>",              
            ])
          : "<p>You do not have any folders. Please create folder.";
        var htmlTemplate = [
          "<h3 class='title mx-auto'><b>Analysis of Datasets</b></h3>",
          message,          
          getHtml(albums),          
        ];
        document.getElementById("app").innerHTML = getHtml(htmlTemplate);
      }
    });
  }

  function listSubAlbums(albumName) {    
      s3.listObjects({ Bucket: albumBucketName,Prefix:albumName, Delimiter: "/" }, function(err, data) {
      if (err) {
        return alert("There was an error listing your folder: " + err.message);
      } else {
        var albums = data.CommonPrefixes.map(function(commonPrefix) {
          var prefix = commonPrefix.Prefix;
          var albumName = decodeURIComponent(prefix.replace("/", ""));
          return getHtml([
            "<li>",
            //"<span onclick=\"deleteAlbum('" + albumName + "')\" style='color:red;cursor:pointer;'>[Delete]</span>",
            "<span onclick=\"viewAlbum('" + albumName + "')\" style='color:blue;cursor:pointer;'>",
            albumName,
            "</span>",
            "</li>"
          ]);
        });
        var message = albums.length
          ? getHtml([
              "<p>This tool wants to help you to analyze structured datasets (Features and Models).</p>",
              //"<p>Click on the <span style='color:blue;'>Folder Name</span> to view it.</p>",
              //"<p>Click on the <span style='color:red;'>[Delete]</span> to delete the album.</p></br>"
            ])
          : "<p>You do not have any folders. Please create folder.";
        var htmlTemplate = [
          "<h3 class='title mx-auto'><b>Analysis of Datasets</b></h3>",
          message,
          "<ul>",
          getHtml(albums),
          "</ul>"
          /* 
          //Hidden logic, only enabled for deleting Albums
          ,
          "<button onclick=\"createAlbum(prompt('Enter Album Name:'))\" class='btn btn-danger btn-block btn-round'>",
          "Create New Album",
          "</button>"*/
        ];
        document.getElementById("app").innerHTML = getHtml(htmlTemplate);
      }
    });
  }

  
  
  function createAlbum(albumName) {
      albumName = albumName.trim();      
    if (!albumName) {
      return alert("Album names must contain at least one non-space character.");
    }
    if (albumName.indexOf("/") !== -1) {
      return alert("Album names cannot contain slashes.");
    }       
    var albumKey = albumName.concat(albumName,"/");    
    s3.headObject({ Key: albumKey }, function(err, data) {
      if (!err) {
        return alert("Folder already exists.");
      }
      if (err.code !== "NotFound") {
        return alert("There was an error creating your folder: " + err.message);
      }
      s3.putObject({ Key: albumKey }, function(err, data) {
        if (err) {
          return alert("There was an error creating your folder: " + err.message);
        }
        alert("Successfully created folder.");
        viewAlbum(albumName);
      });
    });
  }

  function createMainDatasetAlbum(albumName) {       
    if (!albumName) {
      return alert("Album names must contain at least one non-space character.");
    }
    if (albumName.indexOf("/") !== -1) {
      return alert("Album names cannot contain slashes.");
    }
    var albumKey = encodeURIComponent(albumName)+"/";
    s3.headObject({ Key: albumKey }, function(err, data) {
      if (!err) {
        return alert("Folder already exists.");
      }
      if (err.code !== "NotFound") {
        return alert("There was an error creating your folder: " + err.message);
      }
      s3.putObject({ Key: albumKey }, function(err, data) {
        if (err) {
          return alert("There was an error creating your folder: " + err.message);
        }
        alert("Successfully created folder.");
        //Listar Folders
        viewAndLoadDatasets(albumName);
      });
    });
  }

  function uploadDatasetsTestLambda(albumName) {
    executeLambdaFunction(albumName);     
  }

  function uploadDatasets(albumName) {
    var timestamp = new Date().getTime();        
    var albumName = albumName.concat(timestamp);    
    addPhoto(albumName, timestamp);                
  }

  function executeLambdaFunction(timestamp){
    $.ajax({
      type: 'POST', 
      url: "https://hrbkcwgg8d.execute-api.us-east-1.amazonaws.com/uaz-stage-sandbox", 
      dataType: 'json',            
      beforeSend: function(request) {        
      },
      contentType: 'application/json', 
      data: JSON.stringify({
        'folder_name': timestamp}),
      success: function(data) {
        if(data['error'] == null) {
            alert('Registro exitoso');              
        } else {
            alert('Ha ocurrido un error en la asignacion de tiempo: ' + data['error']);
        }            
      },
      error: function() {
          //alert('Ha ocurrido un error en la asignacion de tiempo');
          console.log('La funcion esta funcionando')
      }
    });

    /*var apigateway = new AWS.APIGateway();
    var params = {
      httpMethod: 'POST',
      resourceId: 'vlfw419e94',
      restApiId: '0r32io5uz5',
      body: JSON.stringify({"folder_name":timestamp}),
      //clientCertificateId: 'STRING_VALUE',
      headers: {
        "content-type": "application/json"        
      }
    };
    apigateway.testInvokeMethod(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });*/

  }


  function viewAlbum(albumName) {
    //alert('albumName: '+albumName)
    var albumPhotosKey = encodeURIComponent(albumName) + "/";
    
    s3.listObjects({ Prefix: albumPhotosKey }, function(err, data) {
      if (err) {
        return alert("There was an error viewing your album: " + err.message);
      }
      // 'this' references the AWS.Response instance that represents the response
      var href = this.request.httpRequest.endpoint.href;
      var bucketUrl = href + albumBucketName + "/";
      var count = 0;
      var photos = data.Contents.map(function(photo) {
        var photoKey = photo.Key;
        var photoUrl = bucketUrl + encodeURIComponent(photoKey);        
        var pathFolder = photoKey.replace("/","");        
        pathFolder = bucketUrl+pathFolder+"%2F";                
        if(photoUrl != (pathFolder)){
          count = count+1;
          return getHtml([
            "<tr>",
            "<td>",            
            '<img style="width:30px;height:23px;" src="./assets/img/csv_image.png"/>',
            "</td>",
            '<td>'+photoKey.replace(albumPhotosKey, "")+'</td>',
            "<td>",
            "<div>",
            "<span onclick=\"deletePhoto('" +
              albumName +
              "','" +
              photoKey +
              "')\" style='color:red;cursor:pointer;'>",
            "[Delete]&nbsp;&nbsp;",
            "</span>",            
            "</div>",
            "</td>",
            "</tr>"
          ]);
        } else {
          return getHtml([
            ""
          ]);
        }
      });      
      var message = count>0
        ? ""        
        : "<p>You do not have any files in this folder. Please add files.</p></br>";        
      var htmlTemplate = [
        "<h3 class='title mx-auto'>",
        "<b>" + albumName+'</b>',
        "</h3>",
        "<h4 class='title'>Upload a new Dataset</h4>",
        "<div class='custom-file mb-3'>",
        '<input id="photoupload" type="file" accept=".csv">',                
        '<button id="addphoto" onclick="uploadDatasets(\'' + albumName + "')\" class='btn-primary'>",        
        "Add Dataset (Less than 250 MB)",
        "</button>",
        "</div></br>",        
        "<div>",
        "<h4 class='title'>List of Datasets</h4>",
        message,
        "<table class='table-responsive'>",
        "<tr><th></th><th>File Name&nbsp;&nbsp;&nbsp;&nbsp;</th><th>Operation&nbsp;&nbsp;&nbsp;&nbsp;</th></tr>",
        getHtml(photos),
        "</table></div></br>",                
        '<button onclick="listAlbums()" class="btn btn-danger btn-block btn-round">',
        "Back To Main Folders",
        "</button>"
      ];
      document.getElementById("app").innerHTML = getHtml(htmlTemplate);
    }); 
  }

  function viewAndLoadDatasets(albumName) {     
    albumName = encodeURIComponent(albumName) + "/";
    //s3.listObjects({ Bucket: "uaz-unir-bucket",Prefix:albumName, Delimiter: "/" }, function(err, data) {      
    s3.listObjects({ Bucket: albumBucketName,Prefix:albumName, Delimiter: "/" }, function(err, data) {      
      if (err) {
        return alert("There was an error viewing your album: " + err.message);
      }         

      // 'this' references the AWS.Response instance that represents the response      
      var count = 0;
      
      var subAlbums = data.CommonPrefixes.map(function(commonPrefix) {                  
        var prefix = commonPrefix.Prefix;
        //alert('prefix: '+prefix)  
        var intAlbumName = prefix;        
        count = count+1;
        return getHtml([
          "<tr>",
          "<td>",
          "<span onclick=\"viewDatasetFolder('" + intAlbumName + "')\" style='color:blue;cursor:pointer;'>",            
          intAlbumName,
          "</span>",
          "</td>",
          "<td>",
          "<span onclick=\"deleteAlbum('" + intAlbumName + "')\" style='color:red;cursor:pointer;'>[Delete]</span>",
          "</td>",
          "</tr>"
        ]);              
      });          
      var message = count>0
        ? ""
        //? "<p>Click on the <span style='color:red;'>[Delete]</span> to delete the file.</p></br>"
        : "<p>You do not have any files in this folder. Please add files.</p></br>";        
      var htmlTemplate = [
        "<h3 class='title mx-auto'>",
        "<b>" + albumName+'</b>',
        "</h3>",
        "<h4 class='title'>Upload a new Dataset</h4>",
        "<div class='custom-file mb-3'>",
        '<input id="photoupload" type="file" accept=".csv">',        
        //'<button id="addphoto" onclick="addPhoto(\'' + albumName + "')\" class='btn-primary'>",
        '<button id="addphoto" onclick="uploadDatasets(\'' + albumName + "')\" class='btn-primary'>",        
        "Add Dataset (Less than 250 MB)",
        "</button>",
        "</div></br>",        
        "<div>",
        "<h4 class='title'>List of Datasets</h4>",
        message,
        "<table class='table-responsive'>",
        "<tr><th>File Name&nbsp;&nbsp;&nbsp;&nbsp;</th><th>Operation&nbsp;&nbsp;&nbsp;&nbsp;</th></tr>",
        getHtml(subAlbums),
        "</table></div></br>",                
        '<button onclick="listAlbums()" class="btn btn-danger btn-block btn-round">',
        "Back To Main Folders",
        "</button>"
      ];
      document.getElementById("app").innerHTML = getHtml(htmlTemplate);
    }); 
  }

  function download(myKey){
    const url = s3.getSignedUrl('getObject', {
      Bucket: albumBucketName,
      Key: myKey,
      Expires: 300
     })    
    return url;     
  }
  
  function viewDatasetFolder(albumName) {
    albumPhotosKey = albumName;
    //alert("viewDatasetFolder albumName " + albumName)
    s3.listObjects({ Prefix: albumPhotosKey }, function(err, data) {
      if (err) {
        return alert("There was an error viewing your album: " + err.message);
      }
      // 'this' references the AWS.Response instance that represents the response
      var href = this.request.httpRequest.endpoint.href;
      var bucketUrl = href + albumBucketName + "/";
      var count = 0;
      var photos = data.Contents.map(function(photo) {
        var photoKey = photo.Key;
        var photoUrl = bucketUrl + encodeURIComponent(photoKey);        
               
        var pathAlbumphoto = bucketUrl+albumPhotosKey;        
        var pathPhotoUrl = bucketUrl+photoKey;
        var photoUrl = download(photoKey);        
        //alert("viewDatasetFolder pathAlbumphoto " + pathAlbumphoto)
        //alert("viewDatasetFolder pathPhotoUrl " + pathPhotoUrl)
        if(pathAlbumphoto != (pathPhotoUrl)){
          count = count+1;
          return getHtml([
            "<tr>",
            "<td>",            
            '<img style="width:30px;height:23px;" src="./assets/img/file.jpg"/>',
            "</td>",
            "<td><a href='"+photoUrl+"'>"+photoKey.replace(albumPhotosKey, "")+"</a></td>",
            //"<td>",
            //"<div>",
            //"<span onclick=\"deletePhoto('" +
            //  albumName +
            //  "','" +
            //  photoKey +
            //  "')\" style='color:red;cursor:pointer;'>",
            //"[Delete]&nbsp;&nbsp;",
            //"</span>",            
            //"</div>",
            //"</td>",
            "</tr>"
          ]);
        } else {
          return getHtml([
            ""
          ]);
        }
      });      
      var message = count>0
        ? ""
        //? "<p>Click on the <span style='color:red;'>[Delete]</span> to delete the file.</p></br>"
        : "<p>You do not have any files in this folder. Please add files.</p></br>";        
      var htmlTemplate = [
        "<h3 class='title mx-auto'>",
        "<b>" + albumName+'</b>',
        "</h3>",               
        "<div>",
        "<h4 class='title'>List of Files</h4>",
        message,
        "<table class='table-responsive'>",
        "<tr><th></th><th>File Name&nbsp;&nbsp;&nbsp;&nbsp;</th></tr>",
        getHtml(photos),
        "</table></div></br>",                
        "<button onclick=\"viewAndLoadDatasets('ANALYZE-DATASET')\" class='btn btn-danger btn-block btn-round'>",
        "Back To Datasets",
        "</button>"
      ];
      document.getElementById("app").innerHTML = getHtml(htmlTemplate);
    }); 
  }
  
   

  function addPhoto(albumName, timestamp) {
    //alert('Upload: '+ albumName);
    var files = document.getElementById("photoupload").files;
    if (!files.length) {
      return alert("Please choose a file to upload first.");
    }
    var file = files[0];
    var fileName = file.name;   
    var albumPhotosKey = albumName + "/";  //Lo bueno
  
    var photoKey = albumPhotosKey + fileName;
    //alert('photoKey: '+photoKey)
    var upload = new AWS.S3.ManagedUpload({
      signatureVersion: "v4",
      params: {
        Body: fileName, //** */
        Bucket: albumBucketName,
        Key: photoKey,
        Body: file
      }
    });
  
    var promise = upload.promise();
  
    promise.then(
      function(data) {
        alert("Successfully uploaded file.");
        executeLambdaFunction(timestamp.toString());     
        viewDatasetFolder(albumName);
      },
      function(err) {
        return alert("There was an error uploading your file: ", err.message);
      }
    );
  }

  

  function addPhotoReloadedNOUSADO(albumName) {
    //Create File
    var files = document.getElementById("photoupload").files;
    if (!files.length) {
      return alert("Please choose a file to upload first.");
    }
    var file = files[0];
    var fileName = file.name;
    var albumPhotosKey = encodeURIComponent(albumName) + "/";
  
    var photoKey = albumPhotosKey + fileName;
    //alert('photoKey: '+photoKey)
    //alert('albumPhotosKey: '+ albumPhotosKey)
    //alert('fileName: '+fileName)

    var splitPhotoKey = photoKey.split(".");
    var newKey = splitPhotoKey[0]+"_"+new Date().getTime();
    photoKey = newKey+"."+splitPhotoKey[1];
    //alert('photoKey final: '+photoKey) 
    // Use S3 ManagedUpload class as it supports multipart uploads
    var upload = new AWS.S3.ManagedUpload({
      signatureVersion: "v4",
      params: {
        Bucket: albumBucketName,
        Key: photoKey,
        Body: file
      }
    });
  
    var promise = upload.promise();
  
    promise.then(
      function(data) {
        alert("Successfully uploaded file.");
        viewAlbum(albumName);
      },
      function(err) {
        return alert("There was an error uploading your photo: ", err.message);
      }
    );
  }

  
  function deletePhoto(albumName, photoKey) {
    s3.deleteObject({ Key: photoKey }, function(err, data) {
      if (err) {
        return alert("There was an error deleting your file: ", err.message);
      }
      alert("Successfully deleted file.");
      viewDatasetFolder(albumName)
    });
  }

  
  function deleteAlbum(albumPhotosKey) {
    //alert("viewDatasetFolder albumName " + albumName)
    s3.listObjects({ Prefix: albumPhotosKey }, function(err, data) {    
      if (err) {
        return alert("There was an error deleting your album: ", err.message);
      }
      var objects = data.Contents.map(function(object) {
        return { Key: object.Key };
      });
      s3.deleteObjects(
        {
          Delete: { Objects: objects, Quiet: true }
        },
        function(err, data) {
          if (err) {
            return alert("There was an error deleting your folder: ", err.message);
          }
          alert("Successfully deleted folder.");          
          viewAndLoadDatasets('ANALYZE-DATASET')
        }
      );
    });
  }
  