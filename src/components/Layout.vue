<template>
    <div class="layout" v-bind:class="{ current: isCurrent }" v-on:click="click">
        <img :src="getImgSrc()"  />
    </div>
</template>

<script>
import Layout from './Layout'

export default {
  name: 'Layout',
  props: [ 'layout', 'current' ],
  methods: {
    getImgSrc: function() {
        //return `../assets/layout-img/${this.layout.img}`;
        //let path = window.require('path');
        return `assets/layout-img/${this.layout.img}`;
        //return "'../assets/delete.png'";
    },
    isCurrent: function() {
        return this.current === this.layout.name;
    },
    click: function() {
        this.$emit("pick", this.layout);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
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
