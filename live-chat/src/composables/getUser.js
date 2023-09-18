import { ref } from "vue";
import { projectAuth, projectFirestore } from "@/firebase/config";

const user = ref(null);

projectAuth.onAuthStateChanged(async (_user) => {
  user.value = _user;
});

const getUserRole = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      if (user.value) {
        const superusersRef = projectFirestore.collection("superusers");
        const superusersSnapshot = await superusersRef
          .where("emails", "array-contains", user.value.email)
          .get();
        if (!superusersSnapshot.empty) {
          resolve("superadmin");
        } else {
          resolve("user");
        }
      }
    } catch (error) {
      reject(error);
    }
  });
};

export { user, getUserRole };
