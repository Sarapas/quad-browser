<template>
  <div id="app" class="page" @keydown.esc="close">
    <div class="header">
      <h2>Bookmarks</h2>
      <img class="button close-button" src="./assets/close.svg" v-on:click="close" />
    </div>
    <hr />
    <Bookmark
      v-for="(b, index) in bookmarks"
      :key="index"
      v-bind:bookmark="b"
      v-on:delete="onDelete"
      v-on:edit="onEdit"
    />
  </div>
</template>

<script>
import Bookmark from "./components/Bookmark.vue";

export default {
  name: "bookmarks",
  components: {
    Bookmark
  },
  data: function() {
    return {
      bookmarks: []
    };
  },
  methods: {
    onDelete: function(bookmark) {
      this.bookmarks = this.bookmarks.filter(b => b.id !== bookmark.id);
      const { ipcRenderer } = window.require("electron");
      ipcRenderer.send("delete-bookmark", bookmark);
    },
    onEdit: function(bookmark) {
      const { ipcRenderer } = window.require("electron");
      ipcRenderer.send("edit-bookmark", this.bookmarks);
    },
    close: function() {
      const { ipcRenderer, remote } = window.require("electron");
      const currentWindow = remote.getCurrentWindow();
      currentWindow.close();
    }
  },
  mounted: function() {
    const { ipcRenderer } = window.require("electron");
    let _this = this;
    ipcRenderer.on("bookmarks-received", function(event, bookmarks) {
      _this.bookmarks = bookmarks;
    });
    document.addEventListener("keyup", function(e) {
      if (e.keyCode === 27) {
        _this.close();
      }
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
</style>
