const path = require("path");
const multer = require("multer");

const multerImageStorage = multer.diskStorage({
  // Destination to store image
  destination: "uploads",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + req.user.user_id + path.extname(file.originalname)
    );
    // file.fieldname is name of the field (image)
    // path.extname get the uploaded file extension
  },
});
const multerImageUpload = multer({
  storage: multerImageStorage,
  limits: {
    fileSize: 1000000, // 1000000 Bytes = 1 MB
  },
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(png|jpg)$/)) {
      // upload only png and jpg format
      const error_message = "Please upload an image";
      req.error_message = error_message;
      return cb(error_message);
    }
    cb(undefined, true);
  },
});

module.exports = multerImageUpload;
