<template>
    <div class="app page container">
        <h2>Layouts</h2>
        <hr />
        <div class="images">
            <Layout v-for="(l, index) in layouts" :key="index" v-bind:layout="l" v-bind:current="current" v-on:pick="onPick" />
        </div>
    </div>
</template>

<script>
import Layout from './components/Layout.vue'

export default {
  name: 'layouts',
  components: {
      Layout
  },
  props: [ 'current' ],
  data: function() {
    return {
        layouts: [
            { name: 'Single', img: '1.jpg' },
            { name: 'Dual', img: '2.jpg' },
            { name: 'Tri', img: '3.jpg' },
            { name: 'Quad', img: '4.jpg' },
            { name: 'QuadH', img: '3+1.jpg' },
            { name: 'QuadV', img: '1+3.jpg' },
            { name: 'FiveH', img: '5.jpg' },
            { name: 'FiveV', img: '5-2.jpg' },
            { name: 'SixH', img: '6.jpg' },
            { name: 'SixV', img: '6-2.jpg' },
        ]
    };
  },
  methods: {
    onPick: function(layout) {
        const { ipcRenderer, remote } = window.require('electron');
        ipcRenderer.send('change-layout', layout);
        remote.getCurrentWindow().close();
    }
  },
  mounted: function () {
    const { ipcRenderer, remote } = window.require('electron');
    const _this = this;

    ipcRenderer.on('set-current', function (event,layout) {
        _this.current = layout;
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
.images {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
    flex-wrap: wrap;
}
.title {
    display: flex;
    margin-top: 30px;
    margin-bottom: 15px;
    margin-left: 30px;
    font-size: 24px;
}
</style>
