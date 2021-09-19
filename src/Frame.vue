<template>
</template>

<script>
export default {
  data() {
    return {
      thickness: 3,
      color: "#E84B3C",
      style: "solid"
    };
  },
  mounted: function() {
    const { ipcRenderer } = window.require("electron");
    let _this = this;

    function draw() {
      document.body.style.border = `${_this.thickness}px ${_this.style} ${_this.color}`;
    }

    ipcRenderer.on("set-frame-options", function(event, options) {
      _this.thickness = options.thickness;
      _this.color = options.color;
      document.body.style.border = `${_this.thickness}px ${_this.style} ${_this.color}`;
    });

    ipcRenderer.on("set-frame-style", function(event, style) {
      _this.style = style;
      document.body.style.border = `${_this.thickness}px ${_this.style} ${_this.color}`;
    });

    ipcRenderer.send("frame-loaded", null);
  }
};
</script>

<style>
</style>
