<template>
  <div>
    <div class="container">
      <span>{{ shortcut.title }}</span>
      <div>
        <span>{{ baseKey }} +</span>
        <input class="hotkey" v-on:keydown="onKey($event)" type="text" v-model="shortcut.hotkey" />
      </div>
    </div>
    <hr />
  </div>
</template>

<script>
import Shortcut from "./Shortcut";

export default {
  name: "Shortcut",
  props: ["baseKey", "shortcut", "hotkey"],
  methods: {
    onKey: function($event) {
      event.preventDefault();
      let oldKey = this.shortcut.hotkey;
      let newKey = $event.key.toUpperCase();

      this.shortcut.hotkey = newKey;
      if (newKey !== oldKey) {
        this.$emit("change", {
          title: this.shortcut.title,
          old: oldKey,
          new: newKey
        });
      }
    }
  },
  mounted: function() {
    const util = window.require("electron-util");
    if (util.is.macos) this.baseKey = "Command";
    if (util.is.windows) this.baseKey = "Ctrl";
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.hotkey {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 15px;
  width: 80px;
}
</style>
