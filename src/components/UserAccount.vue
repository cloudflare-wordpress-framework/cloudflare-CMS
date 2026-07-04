<template>
  <div class="user-account">
    <p v-if="loadingUser">Loading user info...</p>
    <div v-else-if="user">
      <p>Logged in as: {{ user.email }}</p>

      <div class="profile-form-container">
        <h2>Update Profile Info</h2>
        <DynamicForm
          :schema="schema"
          action="/api/user"
          method="POST"
          submitLabel="Save Account"
          :token="token"
          :initialData="userData"
          @success="handleSuccess"
        />

        <hr style="margin: 2rem 0;" />

        <h2>Change Password</h2>
        <form @submit.prevent="updatePwd" class="dynamic-form" style="margin-bottom: 2rem;">
          <div class="form-group">
            <label for="new-password">New Password</label>
            <input type="password" id="new-password" v-model="newPassword" required minlength="6" />
          </div>
          <button type="submit" :disabled="loadingPwd">Update Password</button>
          <p v-if="pwdMsg">{{ pwdMsg }}</p>
        </form>
      </div>

      <button @click="handleLogout" style="margin-top: 2rem;">Logout</button>
    </div>
    <div v-else>
      <p>Redirecting to login...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { auth } from '../lib/firebase/client';
import { onAuthStateChanged, signOut, updatePassword } from 'firebase/auth';
import DynamicForm from './DynamicForm.vue';
import schemaRaw from '../../forms/user.schema.json';

const schema = ref(schemaRaw);
const user = ref(null);
const loadingUser = ref(true);
const token = ref('');
const userData = ref({});

const newPassword = ref('');
const loadingPwd = ref(false);
const pwdMsg = ref('');

onMounted(() => {
  onAuthStateChanged(auth, async (currentUser) => {
    loadingUser.value = false;
    if (currentUser) {
      user.value = currentUser;
      token.value = await currentUser.getIdToken();

      // Attempt to fetch current user data to prepopulate the form
      try {
        const res = await fetch('/api/user', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        });
        if (res.ok) {
           const data = await res.json();
           userData.value = data;
        }
      } catch (err) {
        console.error('Failed to fetch user data', err);
      }
    } else {
      window.location.href = '/login';
    }
  });
});

const handleSuccess = (res) => {
  alert('Account updated successfully!');
};

const updatePwd = async () => {
  loadingPwd.value = true;
  pwdMsg.value = '';
  try {
    await updatePassword(user.value, newPassword.value);
    pwdMsg.value = 'Password updated successfully!';
    newPassword.value = '';
  } catch (err) {
    pwdMsg.value = `Failed to update password: ${err.message}`;
  } finally {
    loadingPwd.value = false;
  }
};

const handleLogout = () => {
  signOut(auth);
};
</script>

<style scoped>
.dynamic-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
  margin: 0 auto;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  padding: 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:disabled {
  background-color: #ccc;
}
button:hover:not(:disabled) {
  background-color: #0056b3;
}
</style>
