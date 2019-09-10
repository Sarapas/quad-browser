<template>
  <div id="app">
    <h2>Bookmarks</h2>
    <div class="page">
      <Bookmark v-for="b in bookmarks" v-bind:key="b.title" v-bind:bookmark="b" />
    </div>
  </div>
</template>

<script>
import Bookmark from './components/Bookmark.vue'

export default {
  name: 'app',
  components: {
    Bookmark
  },
  data: function() {
    return {
      bookmarks: [
        { title: 'Google', url: "https://google.com" },
        { title: 'YouTube', url: "https://youtube.com" },
        { title: 'GitHub', url: "https://github.com" }
      ]
    };
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
