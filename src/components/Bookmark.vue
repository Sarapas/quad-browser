<template>
  <div>
    <div class="container">
      <span>{{ bookmark.title }}</span>
      <img src="../assets/delete.png" class="delete-icon"/>
    </div>
    <hr>
  </div>
</template>

<script>
import Bookmark from './Bookmark'

export default {
  name: 'Bookmark',
  props: [ 'bookmark' ]
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
a {
  color: #42b983;
}
.delete-icon {
  width: 16px;
  height: 16px;
  margin: 2px;
}
.container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
