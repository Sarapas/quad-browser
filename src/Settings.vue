<template>
  <div id="app" @keydown.esc="close">
    <h2>Bookmarks</h2>
    <div class="page">
      <Bookmark v-for="(b, index) in bookmarks" :key="index" v-bind:bookmark="b" v-on:delete="onDelete" />
    </div>
  </div>
</template>

<script>
import Bookmark from './components/Bookmark.vue'

export default {
  name: 'settings',
  components: {
    Bookmark
  },
  data: function() {
    return {
      // bookmarks: [
      //   { title: 'Google', url: "https://google.com" },
      //   { title: 'YouTube', url: "https://youtube.com" },
      //   { title: 'GitHub', url: "https://github.com" }
      // ]
      bookmarks: []
    };
  },
  methods: {
    onDelete: function(bookmark) {
      this.bookmarks = this.bookmarks.filter(b => b.id !== bookmark.id);
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('delete-bookmark', bookmark);
    }
  },
  mounted: function () {
    const { ipcRenderer } = window.require('electron');
    let _this = this;
    ipcRenderer.on('bookmarks-received', function (event,bookmarks) {
      _this.bookmarks = bookmarks;
    });
    document.addEventListener('keyup', function (e) {
      if (e.keyCode === 27) {
        const { ipcRenderer, remote } = window.require('electron');
        const currentWindow = remote.getCurrentWindow();
        currentWindow.close();
      }
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
  margin-top: 60px;
}
.page {
  max-width: 90%;
  margin: 0 auto;
}
</style>
