<template>
    <div id="app" class="page">
        <h2>Layouts</h2>
        <hr />
        <div class="images">
          <div class="layout" v-bind:class="{ current: isCurrent('SINGLE') }" v-on:click="onPick('SINGLE')">
            <img src="./assets/layout-img/SINGLE.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('DUAL') }" v-on:click="onPick('DUAL')">
            <img src="./assets/layout-img/DUAL.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('TRI') }" v-on:click="onPick('TRI')">
            <img src="./assets/layout-img/TRI.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('QUAD') }" v-on:click="onPick('QUAD')">
            <img src="./assets/layout-img/QUAD.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('QUADH') }" v-on:click="onPick('QUADH')">
            <img src="./assets/layout-img/QUADH.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('QUADV') }" v-on:click="onPick('QUADV')">
            <img src="./assets/layout-img/QUADV.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('FIVEH') }" v-on:click="onPick('FIVEH')">
            <img src="./assets/layout-img/FIVEH.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('FIVEV') }" v-on:click="onPick('FIVEV')">
            <img src="./assets/layout-img/FIVEV.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('SIXH') }" v-on:click="onPick('SIXH')">
            <img src="./assets/layout-img/SIXH.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('SIXV') }" v-on:click="onPick('SIXV')">
            <img src="./assets/layout-img/SIXV.jpg" />
          </div>
          <!-- <div class="layout" v-bind:class="{ current: isCurrent('NINE') }" v-on:click="onPick('NINE')">
            <img src="./assets/layout-img/9.jpg" />
          </div> -->
        </div>
    </div>
</template>

<script>
export default {
  name: 'layouts',
  data: function() {
    return {
        current: ''
    };
  },
  methods: {
    onPick: function(layout) {
        const { ipcRenderer, remote } = window.require('electron');
        ipcRenderer.send('change-layout', layout);
        remote.getCurrentWindow().close();
    },
    isCurrent: function(layout) {
        return this.current === this.layout;
    },
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
.layout {
    position: relative;
    margin: 15px;
    height: 70px;
    width: 120px;
}
.layout img {
    height: 100%;
    width: 120px;
}
.layout:after {
    position:absolute;
    opacity:0;
    transition: all 0.5s;
    -webkit-transition: all 0.5s;
    content:'';
    width:100%; 
    height:100%;
    top:0; left:0;
    background:rgba(0,0,0,0.3);
}
.current:after {
    position:absolute;
    transition: all 0.5s;
    -webkit-transition: all 0.5s;
    content:'';
    opacity: 1;
    width:100%; 
    height:100%;
    top:0; left:0;
    background:rgba(0,0,0,0.3);
}
.layout:hover:after {
    opacity:1;
}
</style>
