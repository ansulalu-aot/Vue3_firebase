<template>
  <div class="container">
    <Navbar />
    <ChatWindow :groupId="groupId" />
    <NewChatForm :groupId="groupId" />
  </div>
</template>

<script>
import NewChatForm from "../components/NewChatForm.vue";
import ChatWindow from "../components/ChatWindow.vue";
import Navbar from "../components/Navbar.vue";
import { user } from "../composables/getUser";
import { watch } from "vue";
import { useRouter } from "vue-router";

export default {
  components: { Navbar, NewChatForm, ChatWindow },
  setup() {
    const router = useRouter();
    const groupId = router.currentRoute.value.params.groupId;

    watch(user, () => {
      if (!user.value) {
        router.push({ name: "Welcome" });
      }
    });

    return { groupId };
  },
};
</script>

<style>
</style>