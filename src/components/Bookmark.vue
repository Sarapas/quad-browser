<template>
    <span>Test</span>
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
</style>
