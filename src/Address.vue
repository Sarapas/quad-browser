<template>
  <div id="app">
    <div class="container">
      <!-- <input type="text" autofocus v-model="address" @keyup="onAddressChange" v-on:keyup.esc="close" v-on:keyup.enter="open" class="address-field" placeholder="Address" />
      <img class="button" src="./assets/forward.svg" v-on:click="open"  />
      <img class="button close-button" src="./assets/close.svg" v-on:click="close" />-->
      <!-- <my-react-component :message="message" @reset="reset" /> -->
    </div>
  </div>
</template>

<script>
  import MyReactComponent from './MyReactComponent'

export default {
  name: "address",
  data: function() {
    return {
      message: "Hi from React"
    };
  },
  props: ["address"],
  methods: {
    reset: function() {
      this.message = "";
    },
    onAddressChange: function() {},
    open: function() {
      if (!this.address) return;

      const { ipcRenderer } = window.require("electron");
      ipcRenderer.send("load-url", this.address);
      this.close();
    },
    close: function() {
      const { remote } = window.require("electron");
      const currentWindow = remote.getCurrentWindow();
      currentWindow.close();
    }
  },
  mounted: function() {
    this.address = "https://";
  },
  components: { 'my-react-component': MyReactComponent }
};
</script>

<style>
body {
  margin: 0px;
}
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
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
.button {
  opacity: 0.54;
  padding: 2px;
  position: relative;
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
.address-field {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
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
