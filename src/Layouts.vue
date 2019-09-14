<template>
    <div id="app" class="page">
        <div class="header">
        	<h2>Layouts</h2>
        	<img class="button close-button" src="./assets/close.svg" v-on:click="close" />
        </div>
        <hr />
        <div class="images">
          <div class="layout" v-bind:class="{ current: isCurrent('Single') }" v-on:click="onPick('Single')">
            <img src="./assets/layout-img/SINGLE.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('Dual') }" v-on:click="onPick('Dual')">
            <img src="./assets/layout-img/DUAL.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('Sides') }" v-on:click="onPick('Sides')">
            <img src="./assets/layout-img/SIDES.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('Tri') }" v-on:click="onPick('Tri')">
            <img src="./assets/layout-img/TRI.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('Quad') }" v-on:click="onPick('Quad')">
            <img src="./assets/layout-img/QUAD.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('QuadH') }" v-on:click="onPick('QuadH')">
            <img src="./assets/layout-img/QUADH.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('QuadV') }" v-on:click="onPick('QuadV')">
            <img src="./assets/layout-img/QUADV.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('FiveH') }" v-on:click="onPick('FiveH')">
            <img src="./assets/layout-img/FIVEH.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('FiveV') }" v-on:click="onPick('FiveV')">
            <img src="./assets/layout-img/FIVEV.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('V1n4') }" v-on:click="onPick('V1n4')">
            <img src="./assets/layout-img/V1n4.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('H4n1') }" v-on:click="onPick('H4n1')">
            <img src="./assets/layout-img/H4n1.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('SixH') }" v-on:click="onPick('SixH')">
            <img src="./assets/layout-img/SIXH.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('SixV') }" v-on:click="onPick('SixV')">
            <img src="./assets/layout-img/SIXV.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('H8') }" v-on:click="onPick('H8')">
            <img src="./assets/layout-img/H8.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('V8') }" v-on:click="onPick('V8')">
            <img src="./assets/layout-img/V8.jpg" />
          </div>
          <div class="layout" v-bind:class="{ current: isCurrent('Nine') }" v-on:click="onPick('Nine')">
            <img src="./assets/layout-img/NINE.jpg" />
          </div>
        </div>
        <!-- <hr />
        <div class="alignments">
          <div class="radio">
            <input type="radio" name="alignment" v-model="alginment" value="left" /> LEFT
          </div>
          <div class="radio">
            <input type="radio" name="alignment" v-model="alginment" value="center" /> CENTER
          </div>
          <div class="radio">
            <input type="radio" name="alignment" v-model="alginment" value="right" /> RIGHT
          </div>
        </div> -->
    </div>
</template>

<script>
export default {
  name: 'layouts',
  data: function() {
    return {
        current: '',
        alignment: ''
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
	close: function() {
        const { ipcRenderer, remote } = window.require('electron');
        const currentWindow = remote.getCurrentWindow();
        currentWindow.close();
	}
  },
  mounted: function () {
    const { ipcRenderer, remote } = window.require('electron');
    const _this = this;

    ipcRenderer.on('set-current-layout', function (event,layout) {
        _this.current = layout;
    });

    ipcRenderer.send('change-layout-loaded', null);

    document.addEventListener('keyup', function (e) {
      if (e.keyCode === 27) {
		  _this.close();
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
.header {
	position: relative;
	display: flex;
  	justify-content: center;
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
.alignments {
    display: flex;
    justify-content: space-between;
    max-width: 50%;
    margin: 0 auto;
}
.radio {
    display: flex;
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
h2 {
	margin: 0;
}
</style>
