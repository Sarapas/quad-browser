<template>
  	<div id="app" class="page" @keydown.esc="close">
        <div class="header">
        	<h2>Shortcuts</h2>
        	<img class="button close-button" src="./assets/close.svg" v-on:click="close" />
        </div>
		<hr />
      	<Shortcut v-for="(s, index) in shortcuts" :key="index" v-bind:shortcut="s" />
  	    <div class="container">
            <input class="btn" type="button" value="Cancel" v-on:click="close" />
            <input class="btn" type="button" value="Save" v-on:click="save" />
        </div>
  	</div>
</template>

<script>
import Shortcut from './components/Shortcut.vue'

export default {
  name: 'shortcuts',
  components: {
    Shortcut
  },
  data: function() {
    return {
      shortcuts: [
          { title: 'Save bookmark', hotkey: 'B' },
          { title: 'Change layout', hotkey: 'L' },
          { title: 'Hover mode', hotkey: 'H' },
          { title: 'Fullscreen players', hotkey: 'Q' },
          { title: 'Mute', hotkey: 'M' },
          { title: 'Change address', hotkey: 'D' },
          { title: 'Find', hotkey: 'F' },
          { title: 'Refresh', hotkey: 'R' },
          { title: 'Open Notepad', hotkey: 'N' }
      ]
    };
  },
  methods: {
    save: function() {
        // TODO: validate
        ipcRenderer.send('save-shortcuts', this.shortcuts);
        close();
	},
	close: function() {
        const { ipcRenderer, remote } = window.require('electron');
        const currentWindow = remote.getCurrentWindow();
        currentWindow.close();
	}
  },
  mounted: function () {
    const { ipcRenderer } = window.require('electron');
    let _this = this;

    ipcRenderer.on('set-shortcuts', function (event,shortcuts) {
      //_this.shortcuts = shortcuts;
    });
    ipcRenderer.send('shortcuts-loaded');
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
	margin-top: 60px;
}
.header {
	position: relative;
	display: flex;
  	justify-content: center;
}
.container {
	display: flex;
  justify-content: flex-end;
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
.btn {
    height: 50px;
    width: 100px;
    font-size: 200px;
}
</style>
