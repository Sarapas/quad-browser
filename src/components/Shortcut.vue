<template>
  <div>
    <div class="container">
        <span>{{ shortcut.title }}</span>
        <div>
            <span>Command + </span>
            <input class="hotkey" v-on:keydown="onKey($event)" type="text" v-model="shortcut.hotkey" />
        </div>
    </div>
    <hr>
  </div>
</template>

<script>
import Shortcut from './Shortcut'

export default {
  name: 'Shortcut',
  props: [ 'shortcut', 'hotkey' ],
  methods: {
    onKey: function ($event) {
      event.preventDefault();
      this.shortcut.hotkey = $event.key;
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.container {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.hotkey {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-size: 15px;
    width: 80px;
}
</style>
