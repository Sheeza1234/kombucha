// KombuSpot.js
export default class KombuSpot {
  constructor({ id, name, address, latitude, longitude, comment, photoURL, likeCount }) {
    this.id = id;
    this.name = name;
    this.address = address;
    this.latitude = latitude;
    this.longitude = longitude;
    this.comment = comment;
    this.photoURL = photoURL;
    this.likeCount = likeCount;
  }
}
