
const express = require("express")
const router = express.Router();
const path = require("path")
const multer = require("multer")
const fs = require('fs');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
const app = express()

// 1 Create new user
router.post('/create_new_storage', [
    body('name', 'Enter a valid name').isLength({
      min: 3
    }),
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password must be atleast 5 characters').isLength({
      min: 5
    })
  ], async (req, res) => {
    // If there are  errors, return Bad request and the errors
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success,
        errors: errors.array()
      });
    }
    try {
  
      // check whether the user with this email exists already
      let user = await User.findOne({
        email: req.body.email
      });
      if (user) {
        return res.status(400).json({
          error: "Sorry a user with this email already exists"
        })
      }
      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);
      user = await User.create({
        name: req.body.name,
        password: secPass,
        email: req.body.email
      });
      const data = {
        user: {
          id: user.id
        }
      }
      const authToken = jwt.sign(data, JWT_SECRET);
      success = true;
      res.json({
        "status": "ok",
        "message": "Storage Created Successfully"
      }
    )
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  })



  // 2 upload file 

  app.set("views",path.join(__dirname,"views"))
  app.set("view engine","ejs")

  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
  
        // Uploads is the Upload_folder_name
        cb(null, "uploads")
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + "-" + Date.now()+".jpg")
    }
  })

  const maxSize = 1 * 1000 * 1000;
    
var upload = multer({ 
    storage: storage,
    limits: { fileSize: maxSize },
    fileFilter: function (req, file, cb){
    
        // Set the filetypes, it is optional
        var filetypes = /jpeg|jpg|png/;
        var mimetype = filetypes.test(file.mimetype);
  
        var extname = filetypes.test(path.extname(
                    file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
      
        cb("Error: File upload only supports the "
                + "following filetypes - " + filetypes);
      } 
  
// mypic is the name of file attribute
}).single("mypic");       
  
app.get("/",function(req,res){
    res.render("Signup");
})
    
app.post("/upload_file",function (req, res, next) {
        
    // Error MiddleWare for multer file upload, so if any
    // error occurs, the image would not be uploaded!
    upload(req,res,function(err) {
  
        if(err) {
  
            // ERROR occurred (here it can be occurred due
            // to uploading image of size greater than
            // 1MB or uploading different file type)
            res.send(err)
        }
        else {
  
            // SUCCESS, image successfully uploaded
            res.send(
              {
                "status": "ok",
                "file_path": "public/upload/6bc5277a-b3ac-477e-b71d-998c156bc0da.txt"
             }
            )
        }
    })
})
    
// Take any port number of your choice which
// is not taken by any other process
app.listen(8080,function(error) {
    if(error) throw error
        console.log("Server created Successfully on PORT 8080")
})




// 3 Create Audio


var gtts = require('node-gtts')('en');

router.post('/speech', function(req, res) {
  res.set({'Content-Type': 'audio/mpeg'});
  gtts.stream(req.query.text).pipe(res);
})

// save audio file
var path = require('path');
var filepath = path.join(__dirname, 'public/upload/4839379a-4d0a-440e-943f-e1e4b0ebfdb7.mp3');

gtts.save(filepath, ' ', function() {
  console.log('save done');
})  




// 5. merge audio and video

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
// console.log(ffmpegInstaller.path, ffmpegInstaller.version);

router.get('/', function(req, res) {
  let range = req.headers.range;
  console.log(range)
  res.set('Content-Type', 'video/mp4');
	const file = './public/4d';
	// const ffmpeg = require('fluent-ffmpeg');
	const proc = ffmpeg()
	// input video only stream
	.addInput(fs.createReadStream(`${file}-video-streamable.mp4`))
	// input audio only file
	.addInput(`${file}-audio.aac`)
	.format('mp4')
	// required bcz mp4 needs to write header in the front after completing whole encoding
	.outputOptions('-movflags frag_keyframe+empty_moov')
	// display progress
	.on('progress', function(progress) {
		console.log(progress);
	})
	.on('error', function(err) {
		console.log('An error occurred: ' + err.message);
	})
	// after whole merging operation is finished
	.on('end', function() {
		console.log('Processing finished !');
	})

	// pipe the resulting merged stream to output
	const ffStream = proc.pipe();
	ffStream.on('data', function(chunk) {
		console.log('ffmpeg just wrote ' + chunk.length + ' bytes');
	});
	ffStream.pipe(res);
})



// download file

const https = require("https");
const fs = require("fs");

const url = " https://corpinst.herokuapp.com/public/upload/5214c459-47d5-434f-8c25-cce3a5f47ff7.mp4";

https.get(url, (res) => {
   const path = "downloaded-image.jpg";
   const writeStream = fs.createWriteStream(path);

   res.pipe(writeStream);

   writeStream.on("finish", () => {
      writeStream.close();
      console.log("Download Completed!");
   })
   res.send({"sucess":"file will start downloading "})
})


// list all files

router.get('/my_upload_file', fetchuser, async (req, res) => {
  try {

      const data = await Data.find({
          user: req.user.id
      });
      res.json(data)
      res.send({
        "status": "ok",
        "data": [
            data
        ]
    }
    )
  } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
  }
})
  module.exports = router