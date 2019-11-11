<template>
  <div id="app" class="page">
    <div class="header">
      <h2>Get started</h2>
    </div>
    <div>
      <img src="./assets/walkthrough/011_fullscreen_doubleclick.gif" />
    </div>
  <div>
      <h3>You can double-click on one of the screen to put it in fullscreen. Double-click it again to go back.</h3>
      </div>
    <div class="button-container">
      <div>
        <input class="btn" type="button" value="Skip" v-on:click="close" />
      </div>
      <div>
        <input class="btn" type="button" value="Previous" v-on:click="previous" />
        <input class="btn" type="button" value="Next" v-on:click="next" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {};
  },
  methods: {
    close: function() {
        const { ipcRenderer, remote } = window.require("electron");
        const currentWindow = remote.getCurrentWindow();
        currentWindow.close();
    },
    next: function() {},
    previous: function() {}
  },
  mounted: function() {
  }
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
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
}
.btn {
  height: 23px;
  width: 60px;
  font-size: 15px;
}
</style>
