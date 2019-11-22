<template>
  <div id="app" class="page">
    <div class="header">
      <h2>Get started</h2>
    </div>
    <div class="item" :class="{ 'item-visible' : current == 1}">
      <img src="./assets/walkthrough/fullscreen_double_click.gif" />
      <h3>You can double-click on one of the screen to put it in fullscreen. Double-click it again to go back.</h3>
    </div>
    <div class="item" :class="{ 'item-visible' : current == 2}">
      <img src="./assets/walkthrough/fullscreen_number.gif" />
      <h3>When Fullscreen number mode is on - you can use numbers on your keyboard to move between screens. Press 0 to move change back to multiple views. NOTE: this will affect number typing in the screen.</h3>
    </div>
    <div class="item" :class="{ 'item-visible' : current == 3}">
      <img src="./assets/walkthrough/audible_click.gif" />
      <h3>Audio comes from a screen marked with the border. To change audible screen - simply click the one you want to hear.</h3>
    </div>
    <div class="item" :class="{ 'item-visible' : current == 4}">
      <img src="./assets/walkthrough/right_click.gif" />
      <h3>Right click on a screen to see more actions. Use this to navigate to another page, go back, load or save bookmarks. You can also setup auto-refresh for the page, open up a notepad, swap screens and use other cool features.</h3>
    </div>
    <div class="button-container" :class="{ 'button-container-visible' : current != 4}">
      <div>
        <input class="btn" type="button" value="Skip" v-on:click="close" />
      </div>
      <div>
        <input class="btn" type="button" value="Previous" v-on:click="previous" />
        <input class="btn" type="button" value="Next" v-on:click="next" />
      </div>
    </div>
    <div class="button-container" :class="{ 'button-container-visible' : current == 4}">
      <div></div>
      <div>
        <input class="btn" type="button" value="Done" v-on:click="close" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      current: 1
    };
  },
  methods: {
    close: function() {
      const { ipcRenderer, remote } = window.require("electron");
      const currentWindow = remote.getCurrentWindow();
      currentWindow.close();
    },
    next: function() {
      this.current++;
      if (this.current > 4) {
        this.current = 1;
      }
    },
    previous: function() {
      this.current--;
      if (this.current < 1) {
        this.current = 1;
      }
    }
  },
  mounted: function() {}
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 10px;
}
.header {
  position: relative;
  display: flex;
  justify-content: center;
}
.page {
  max-width: 90%;
  margin: 0 auto;
}
.close-button {
  position: absolute;
  right: 0;
  top: 0;
  opacity: 0.54;
  height: 33px;
}
.close-button:hover {
  background: lightgray;
  border-radius: 100%;
}
.example {
  margin-bottom: 30px;
  margin-top: 30px;
}
.button-container {
  display: none;
}
.button-container-visible {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
}
.btn {
  height: 23px;
  width: 60px;
  font-size: 15px;
}
.item {
  display: none;
}
.item-visible {
  display: block;
}
</style>
