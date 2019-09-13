<template>
  <div id="app">
    <h2 class="title">Notepad</h2>
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
.title {
    height: 8vh;
    margin-top: 3vh;
    margin-bottom: 1vh;
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
</style>
