<template>
  <div id="app" class="page">
    <div class="header">
      <h2>Border</h2>
      <img class="button close-button" src="./assets/close.svg" v-on:click="close" />
    </div>
    <hr />
    <div class="form__field">
      <div class="form__label">
        <strong>Choose color:</strong>
        <swatches v-model="color" background-color="transparent" inline></swatches>
      </div>
    </div>

    <div class="form__field">
      <div class="form__label">
        <strong>Choose thickness:</strong>
        <vue-slider ref="slider" v-model="thickness" v-bind="options"></vue-slider>
      </div>
    </div>

    <hr class="example" v-bind:style="{ 'border-top': (thickness + 'px solid ' + color) }" />

    <div class="button-container">
      <div></div>
      <div>
        <input class="btn" type="button" value="Cancel" v-on:click="close" />
        <input class="btn" type="button" value="Save" v-on:click="save" />
      </div>
    </div>
  </div>
</template>

<script>
import Swatches from "vue-swatches";
import "vue-swatches/dist/vue-swatches.min.css";
import VueSlider from "vue-slider-component";
import "vue-slider-component/theme/antd.css";

export default {
  components: { Swatches, VueSlider },
  data() {
    return {
      color: "#E84B3C",
      thickness: 7,
      options: {
        dotSize: 20,
        width: "auto",
        height: 4,
        contained: false,
        direction: "ltr",
        data: null,
        min: 1,
        max: 40,
        interval: 1,
        disabled: false,
        clickable: true,
        duration: 0.5,
        adsorb: false,
        lazy: false,
        tooltip: "focus",
        tooltipPlacement: "top",
        tooltipFormatter: void 0,
        useKeyboard: false,
        enableCross: true,
        fixed: false,
        minRange: void 0,
        maxRange: void 0,
        order: true,
        marks: false,
        dotOptions: void 0,
        process: true,
        dotStyle: void 0,
        railStyle: void 0,
        processStyle: void 0,
        tooltipStyle: void 0,
        stepStyle: void 0,
        stepActiveStyle: void 0,
        labelStyle: void 0,
        labelActiveStyle: void 0
      }
    };
  },
  methods: {
    close: function() {
      const { ipcRenderer, remote } = window.require("electron");
      const currentWindow = remote.getCurrentWindow();
      currentWindow.close();
    },
    save: function() {
      const { ipcRenderer } = window.require("electron");
      ipcRenderer.send("receive-frame-options", {
        color: this.color,
        thickness: this.thickness
      });
      this.close();
    }
  },
  mounted: function() {
    const { ipcRenderer } = window.require("electron");
    let _this = this;

    ipcRenderer.send("frame-options-loaded", null);

    ipcRenderer.on("send-frame-options", function(event, options) {
      _this.color = options.color;
      _this.thickness = options.thickness;
    });
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
