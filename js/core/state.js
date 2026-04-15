import { STADIUMS } from '../config.js';

class StateModel {
  constructor() {
    this.activeStadiumId = 'mumbai';
    this.zones = STADIUMS[this.activeStadiumId].zones;
    this.stalls = STADIUMS[this.activeStadiumId].stalls;
    this.crowd = {};
    this.queues = {};
  }

  setStadium(id) {
    if (STADIUMS[id]) {
      this.activeStadiumId = id;
      this.zones = STADIUMS[id].zones;
      this.stalls = STADIUMS[id].stalls;
    }
  }

  getActiveStadium() {
    return STADIUMS[this.activeStadiumId];
  }
}

export const GlobalState = new StateModel();
