<template>
  <div>
    <div class="container">
      <div class="container">
        <img v-if="bookmark.iconDataURL" class="bookmark-icon" :src="bookmark.iconDataURL" />
        <div v-if="!editMode" class="container">
          <span v-if="!editMode">{{ bookmark.title }}</span>
        </div>
        <div v-if="editMode" class="container">
          <input type="text" class="edit-field" v-model="editValue" />
          <input class="btn" type="button" value="Cancel" v-on:click="cancel" />
          <input class="btn" type="button" value="Save" v-on:click="save" />
        </div>
      </div>
      <div v-if="!editMode">
        <img src="../assets/delete.png" class="action-icon" v-on:click="editBookmark" />
        <img src="../assets/delete.png" class="action-icon" v-on:click="deleteBookmark" />
      </div>
    </div>
    <hr />
  </div>
</template>

<script>
import Bookmark from "./Bookmark";

export default {
  name: "Bookmark",
  props: ["bookmark", "editMode", "editValue"],
  methods: {
    deleteBookmark: function() {
      const { ipcRenderer } = window.require("electron");
      this.$emit("delete", this.bookmark);
    },
    editBookmark: function() {
      this.editMode = true;
      this.editValue = this.bookmark.title;
    },
    save: function() {
      const { ipcRenderer } = window.require("electron");
      this.editMode = false;
      this.bookmark.title = this.editValue;
      this.$emit("edit", this.bookmark);
    },
    cancel: function() {
      this.editMode = false;
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
a {
  color: #42b983;
}
.action-icon {
  width: 16px;
  height: 16px;
  margin: 2px;
  cursor: pointer;
}
.bookmark-icon {
  margin-right: 5px;
}
.container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
}
.edit-field {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 100%;
  height: 100%;
  font-size: 15px;
}
.btn {
  height: 50px;
  width: 100px;
  font-size: 200px;
}
</style>
