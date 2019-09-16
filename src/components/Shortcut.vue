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
  props: ["baseKey", "shortcut"],
  data: function() {
    return {
      notAllowed: [
        "META",
        "ALT",
        "CONTROL",
        "SHIFT",
        "CAPSLOCK",
        "ARROWUP",
        "ARROWDOWN",
        "ARROWLEFT",
        "ARROWRIGHT",
        " ",
        "1", // numbers for switching audible view
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "Q", // quit
        "X", // cut
        "Z", // undo
        "C", // copy
        "V", // paste
        "A" // select
      ]
    };
  },
  methods: {
    onKey: function($event) {
      event.preventDefault();
      let oldKey = this.shortcut.hotkey;
      let newKey = $event.key.toUpperCase();

      if (this.notAllowed.includes(newKey)) return;

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
  mounted: function() {}
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
