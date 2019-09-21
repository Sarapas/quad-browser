<template>
  <div id="app" class="page">
    <div class="header">
      <h2>Shortcuts</h2>
      <img class="button close-button" src="./assets/close.svg" v-on:click="close" />
    </div>
    <hr />
    <Shortcut
      v-for="(s, index) in shortcuts"
      :key="index"
      v-bind:shortcut="s"
      v-bind:baseKey="baseKey"
      v-on:change="onChange"
    />
    <div class="button-container">
      <div>
        <input class="btn" type="button" value="Default" v-on:click="setDefault" />
      </div>
      <div>
        <input class="btn" type="button" value="Cancel" v-on:click="close" />
        <input class="btn" type="button" value="Save" v-on:click="save" />
      </div>
    </div>
  </div>
</template>

<script>
import Shortcut from "./components/Shortcut.vue";

export default {
  name: "shortcuts",
  components: {
    Shortcut
  },
  data: function() {
    return {
      shortcuts: [],
      defaults: [],
      baseKey: ''
    };
  },
  methods: {
    save: function() {
      const { ipcRenderer } = window.require("electron");
      ipcRenderer.send("save-shortcuts", this.shortcuts);
      this.close();
    },
    close: function() {
      const { ipcRenderer, remote } = window.require("electron");
      const currentWindow = remote.getCurrentWindow();
      currentWindow.close();
    },
    setDefault: function() {
      this.shortcuts = JSON.parse(JSON.stringify(this.defaults));
    },
    onChange: function(data) {
      let duplicate = this.shortcuts.find(
        s =>
          s.hotkey.toLowerCase() === data.new.toLowerCase() &&
          s.title !== data.title
      );
      if (duplicate) {
        duplicate.hotkey = data.old;
      }
    }
  },
  mounted: function() {
    const { ipcRenderer } = window.require("electron");
    let _this = this;

    const util = window.require("electron-util");
    if (util.is.macos) this.baseKey = "Command";
    if (util.is.windows) this.baseKey = "Ctrl";

    ipcRenderer.on("set-shortcuts", function(event, shortcutInfo) {
      _this.shortcuts = shortcutInfo.shortcuts;
      _this.defaults = shortcutInfo.defaults;
    });
    ipcRenderer.send("shortcuts-loaded", null);
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
  margin-top: 60px;
}
.header {
  position: relative;
  display: flex;
  justify-content: center;
}
.button-container {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
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
  height: 23px;
  width: 60px;
  font-size: 15px;
}
</style>
