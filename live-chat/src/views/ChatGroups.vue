<template>
  <div class="container">
    <Navbar />
    <h2><u>Chat Groups</u></h2>
    <ul>
      <li v-for="group in chatGroups" :key="group.id">
        <router-link
          :to="{ name: 'Chatroom', params: { groupId: group.id } }" class="custom-link"
          >{{ group.name }}</router-link
        >
      </li>
    </ul>
  </div>
</template>

<script>
import useCollection from "../composables/useCollection";
import Navbar from "../components/Navbar.vue";
import getUser from "../composables/getUser";
import { watch } from "vue";
import { useRouter } from "vue-router";

export default {
  components: { Navbar },
  name: "ChatGroups",
  setup() {
    const { user } = getUser();
    const router = useRouter();

    const { documents: chatGroups, error } = useCollection("chatGroups");

    watch(user, () => {
      if (!user.value) {
        router.push({ name: "Welcome" });
      }
    });
    return {
      chatGroups,
      error,
    };
  },
};
</script>

<style>
h2 {
  text-align: center;
}
li {
  list-style: none;
  padding-bottom: 15px;  
}
.custom-link {
  text-decoration: none;
  color: black;

}
</style>