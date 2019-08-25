import { library } from '@fortawesome/fontawesome-svg-core';

import {
  faChevronCircleUp, faPlusCircle, faPen, faSave, faAsterisk, faImage, faPaperPlane, faTimes, faSearch,
  faBars, faTrashAlt, faBell, faBellSlash, faEnvelope, faCheck, faPrint, faExclamation, faLink, faMinus, faNewspaper,
  faToggleOn, faToggleOff, faSync, faEye
} from '@fortawesome/free-solid-svg-icons';
import { faFacebookF } from '@fortawesome/free-brands-svg-icons/faFacebookF';
import { faTwitter } from '@fortawesome/free-brands-svg-icons/faTwitter';
import { faFacebookMessenger } from '@fortawesome/free-brands-svg-icons/faFacebookMessenger';
import { faGooglePlusG } from '@fortawesome/free-brands-svg-icons/faGooglePlusG';
import { faPinterestP } from '@fortawesome/free-brands-svg-icons/faPinterestP';
import { faRedditAlien } from '@fortawesome/free-brands-svg-icons/faRedditAlien';
import { faTumblr } from '@fortawesome/free-brands-svg-icons/faTumblr';
import { faLinkedinIn } from '@fortawesome/free-brands-svg-icons/faLinkedinIn';

const icons = [
  faFacebookF, faTwitter, faLinkedinIn, faGooglePlusG, faPinterestP, faRedditAlien, faTumblr, faFacebookMessenger,
  faEnvelope, faCheck, faPrint, faExclamation, faLink, faMinus, faBars, faBell, faBellSlash, faTrashAlt, faChevronCircleUp,
  faPlusCircle, faPen, faImage, faAsterisk, faSave, faPaperPlane, faSearch, faTimes, faNewspaper, faToggleOn, faToggleOff,
  faSync, faEye
];

library.add(...icons);