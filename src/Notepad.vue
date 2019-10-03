<template>
  <div id="app">
    <div class="header">
      <h2>Notepad</h2>
      <img class="close-button" src="./assets/close.svg" v-on:click="close" />
    </div>
    <h2 class="title"></h2>
    <textarea autofocus @keyup="onTextChange" v-model="text" class="text-field" placeholder="Type in your notes"></textarea>
  </div>
</template>

<script>

export default {
  name: 'notepad',
    data: function() {
    return {
    };
  },
  props: [ 'text', 'loaded' ],
  methods: {
    onTextChange: function() {
        if (!this.loaded) {
            return;
        }

        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('save-notepad', this.text);
    },
    close: function() {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('close-notepad', this.text);
    }
  },
  mounted: function() {
    const { ipcRenderer } = window.require('electron');
    let _this = this;

    ipcRenderer.send('notepad-loaded', null);

    ipcRenderer.on('get-notepad', function(event, result) {
      _this.text = result;
      _this.loaded = true;
    });
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
body {
  background-color: white;
}
.header {
    height: 8vh;
    margin-top: 2vh;
    margin-bottom: 2vh;
}
.container {
  border-radius: 30px;
  height: 40px;
  -webkit-app-region: no-drag;
  align-items: center;
  overflow: hidden;
  display: flex;
}
.text-field {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 95vw;
  height: 88vh;
  font-size: 15px;
  margin-right: 8px;
  border:#2c3e50;
  outline: none;
  background: transparent;
  margin-left: 8px;
}
.close-button {
	position: absolute;
	right: 6px;
	top: 6px;
  opacity: 0.54;
	height: 33px;
}
.close-button:hover {
  	background: lightgray;
  	border-radius: 100%;
}
</style>
