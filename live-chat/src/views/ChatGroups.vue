<template>
  <div class="container">
    <Navbar />
    <h2><u>Chat Groups</u></h2>
    <ul>
      <li v-for="group in chatGroups" :key="group.id">
        <router-link
          :to="{ name: 'Chatroom', params: { groupId: group.id } }"
          class="custom-link"
          >{{ group.name }}</router-link
        >
      </li>
    </ul>
  </div>
</template>

<script>
import Navbar from "../components/Navbar.vue";
import { watch, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { projectFirestore } from "../firebase/config";
import { user, getUserRole } from "../composables/getUser";

export default {
  components: { Navbar },
  name: "ChatGroups",
  setup() {
    const router = useRouter();
    const chatGroups = ref([]);
    const error = ref(null);

    // Fetch chat groups based on user permissions
    const fetchChatGroups = async () => {
      try {
        console.log("Fetching chat groups...");
        const chatGroupsCollection = projectFirestore.collection("chatGroups");
        const queryPromises = [];

        if (user.value) {
          console.log("user : ", user);
          console.log("user.value : ", user.value);
          // Use async/await to get the user's role
          const userRole = await getUserRole();

          console.log("User role:", userRole);

          // If the user is a superadmin, fetch all groups
          if (userRole === "superadmin") {
            console.log("all");
            queryPromises.push(
              chatGroupsCollection.get().then((querySnapshot) => {
                const allGroups = [];

                querySnapshot.forEach((doc) => {
                  if (doc.exists) {
                    console.log(`Document ID: ${doc.id}`);
                    console.log("Document Data:", doc.data());
                    allGroups.push({
                      ...doc.data(),
                      id: doc.id,
                    });
                  }
                });

                console.log("All Groups:", allGroups);
                return allGroups;
              })
            );
          } else {
            console.log("private");
            console.log(
              "Fetching permitted private groups for user:",
              user.value.email
            );

            // Fetch public groups
            queryPromises.push(
              chatGroupsCollection
                .where("isPrivate", "==", false)
                .get()
                .then((querySnapshot) => {
                  const publicGroups = [];

                  // Iterate through the query results for public groups
                  querySnapshot.forEach((doc) => {
                    if (doc.exists) {
                      console.log(`Document ID: ${doc.id}`);
                      console.log("Document Data:", doc.data());
                      publicGroups.push({
                        ...doc.data(),
                        id: doc.id,
                      });
                    }
                  });
                  console.log("Permitted Public Groups:", publicGroups);
                  return publicGroups;
                })
            );

            // Fetch permitted private groups for other logged-in users
            queryPromises.push(
              (async () => {
                const permittedGroups = [];
                const querySnapshot = await chatGroupsCollection
                  .where("isPrivate", "==", true)
                  .get();

                for (const doc of querySnapshot.docs) {
                  const groupId = doc.id;
                  console.log("groupId : ", groupId);

                  // Check if there is a corresponding document in registeredUsers
                  const registeredUserDocRef = projectFirestore
                    .collection("chatGroups")
                    .doc(groupId)
                    .collection("registeredUsers")
                    .doc(user.value.email);
                  console.log("registeredUserDocRef :", registeredUserDocRef);
                  const registeredUserDoc = await registeredUserDocRef.get();
                  console.log("Checking registeredUserDoc for group:", groupId);

                  if (registeredUserDoc.exists) {
                    // The user has access to this private group
                    console.log(`User has access to group: ${groupId}`);
                    permittedGroups.push({
                      ...doc.data(),
                      id: groupId,
                    });
                    console.log("docData :", doc.data());
                  } else {
                    // The user does not have access to this private group
                    console.log(
                      `User does not have access to group: ${groupId}`
                    );
                  }
                }

                console.log("Permitted Private Groups:", permittedGroups);
                return permittedGroups;
              })()
            );
          }
        }

        const queryResults = await Promise.all(queryPromises);
        console.log("Permitted groups query results:", queryResults);
        // Concatenate and map the results
        const Groups = [].concat.apply([], queryResults);
        const groups = Groups.map((doc) => ({
          ...doc,
        }));
        console.log("groups: ", groups);
        console.log("User email:", user.value.email);
        console.log("Query results:", queryResults);
        chatGroups.value = groups;
        console.log("Chat groups:", chatGroups.value);
      } catch (err) {
        console.error(err.message);
        error.value = "Could not fetch chat groups.";
      }
    };

    // Watch for changes in user and fetch chat groups accordingly
    watch(user, () => {
      console.log("Number of chat groups:", chatGroups.value.length);
      console.log("Chat groups content:", chatGroups.value);
      console.log("User changed:", user.value);
      chatGroups.value = []; // Clear existing chat groups
      error.value = null; // Clear error

      if (!user.value) {
        router.push({ name: "Welcome" });
      } else {
        fetchChatGroups(); // Fetch chat groups based on user permissions
      }
    });

    // Fetch chat groups on component mount
    onMounted(() => {
      fetchChatGroups();
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
