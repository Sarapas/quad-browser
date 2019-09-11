<template>
  <div id="app">
    <div class="container">
      <img class="icon" src="./assets/find.svg" />
      <input ref="findtext" autofocus v-model="text" @keyup="onTextChange" v-on:keyup.esc="close" type="text" class="find-field" placeholder="Find in page" />
      <span class="counts">{{match}}/{{totalMatches}}</span>
      <img class="button" src="./assets/up.svg" v-on:click="up"  />
      <img class="button" src="./assets/down.svg" v-on:click="down"  />
      <img class="button close-button" src="./assets/close.svg" v-on:click="close" />
    </div>
  </div>
</template>

<script>

export default {
  name: 'find',
    data: function() {
    return {
      match: 0,
      totalMatches: 0
    };
  },
  props: [ 'text' ],
  methods: {
    onTextChange: function() {
      const { ipcRenderer } = window.require('electron');
      if (this.text) {
        ipcRenderer.send('find', this.text);
      } else {
        ipcRenderer.send('find-stop');
      }
    },
    up: function() {
      if (!this.text)
        return;

      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('find-up', this.text);
      this.$refs.findtext.focus();
    },
    down: function() {
      if (!this.text)
        return;

      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('find-down', this.text);
      this.$refs.findtext.focus();
    },
    close: function() {
      const { ipcRenderer, remote } = window.require('electron');
      const currentWindow = remote.getCurrentWindow();
      ipcRenderer.send('find-stop');
      currentWindow.close();
    },
  },
  mounted: function() {
    const { ipcRenderer } = window.require('electron');
    let _this = this;

    ipcRenderer.on('update-matches', function(event, result) {
      _this.match = result.match;
      _this.totalMatches = result.totalMatches;
    });
  }
}
</script>

<style>
body {
  margin: 0px;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
.container {
  border-radius: 30px;
  height: 40px;
  -webkit-app-region: no-drag;
  align-items: center;
  overflow: hidden;
  display: flex;
}
.counts {
  opacity: 0.54;
  font-size: 15px;
  margin-left: 5px;
  margin-right: 5px;
}
.button {
  opacity: 0.54;
  padding: 2px;
  position: relative;
}
.icon {
  margin-left: 12px;
  height: 20px;
  opacity: 0.54;
}
.close-button {
  height: 18px;
  padding: 6px;
  margin-right: 12px;
}
.button:hover {
  background: lightgray;
  border-radius: 100%;
}
.find-field {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 100%;
  height: 100%;
  font-size: 15px;
  margin-right: 8px;
  border: none;
  outline: none;
  background: transparent;
  margin-left: 8px;
}
</style>
