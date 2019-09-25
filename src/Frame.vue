<template>
</template>

<script>
export default {
  data() {
    return {
    };
  },
  mounted: function() {
    const { ipcRenderer } = window.require("electron");
    let _this = this;

    ipcRenderer.on("set-frame-style", function(event, options) {
        document.body.style.border = `${options.thickness}px solid ${options.color}`;
    });

    ipcRenderer.send("frame-loaded", null);
  }
};
</script>

<style>
</style>
