const path = require('path');

const LOGO_PATH = path.join(__dirname, '../assets/logo.png');
const LOGO_ASPECT = 203 / 455; // height / width of the source PNG
const LOGO_CID = 'ooktravel-logo';

// Nodemailer attachment for embedding the logo inline via <img src="cid:ooktravel-logo">.
function logoEmailAttachment() {
  return { filename: 'logo.png', path: LOGO_PATH, cid: LOGO_CID };
}

module.exports = { LOGO_PATH, LOGO_ASPECT, LOGO_CID, logoEmailAttachment };
