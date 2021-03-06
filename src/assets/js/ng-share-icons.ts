import { library } from '@fortawesome/fontawesome-svg-core';

import {
  faChevronCircleUp, faInfoCircle, faPlusCircle, faPen, faSave, faAsterisk, faImage, faPaperPlane, faTimes, faSearch,
  faBars, faTrashAlt, faBell, faBellSlash, faEnvelope, faCheck, faPrint, faExclamation, faLink, faMinus, faNewspaper,
  faToggleOn, faToggleOff, faSync, faEye, faLongArrowAltUp, faLongArrowAltDown, faStar, faChartLine, faArrowsAltH, faArrowsAltV
} from '@fortawesome/free-solid-svg-icons';
import { faFacebookF } from '@fortawesome/free-brands-svg-icons/faFacebookF';
import { faTwitter } from '@fortawesome/free-brands-svg-icons/faTwitter';
import { faFacebookMessenger } from '@fortawesome/free-brands-svg-icons/faFacebookMessenger';
import { faGooglePlusG } from '@fortawesome/free-brands-svg-icons/faGooglePlusG';
import { faPinterestP } from '@fortawesome/free-brands-svg-icons/faPinterestP';
import { faRedditAlien } from '@fortawesome/free-brands-svg-icons/faRedditAlien';
import { faTumblr } from '@fortawesome/free-brands-svg-icons/faTumblr';
import { faLinkedinIn } from '@fortawesome/free-brands-svg-icons/faLinkedinIn';
import { faHotjar } from '@fortawesome/free-brands-svg-icons/faHotjar';

const icons = [
  faFacebookF, faTwitter, faLinkedinIn, faGooglePlusG, faPinterestP, faRedditAlien, faTumblr, faFacebookMessenger,
  faEnvelope, faCheck, faPrint, faExclamation, faLink, faMinus, faBars, faBell, faBellSlash, faTrashAlt, faChevronCircleUp,
  faPlusCircle, faPen, faImage, faAsterisk, faSave, faPaperPlane, faSearch, faTimes, faNewspaper, faToggleOn, faToggleOff,
  faSync, faEye, faHotjar, faLongArrowAltUp, faLongArrowAltDown, faStar, faChartLine, faInfoCircle, faArrowsAltH, faArrowsAltV
];

library.add(...icons);