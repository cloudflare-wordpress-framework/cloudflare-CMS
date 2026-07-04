<template>
  <form @submit.prevent="handleSubmit" class="dynamic-form">
    <div v-for="(propDetails, propName) in filteredProperties" :key="propName" class="form-group">
      <label :for="propName">
        {{ propDetails.description || propDetails.title || propName }}
        <span v-if="isRequired(propName)" class="required">*</span>
      </label>

      <select v-if="propDetails.enum" :id="propName" v-model="formData[propName]" :required="isRequired(propName)">
        <option v-for="option in propDetails.enum" :key="option" :value="option">{{ option }}</option>
      </select>

      <input
        v-else
        :type="getInputType(propName, propDetails)"
        :id="propName"
        v-model="formData[propName]"
        :required="isRequired(propName)"
      />
    </div>

    <button type="submit" :disabled="loading">{{ loading ? 'Saving...' : submitLabel }}</button>
    <p v-if="message" :class="{'error': error, 'success': !error}">{{ message }}</p>
  </form>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({
  schema: {
    type: Object,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  method: {
    type: String,
    default: 'POST'
  },
  submitLabel: {
    type: String,
    default: 'Submit'
  },
  initialData: {
    type: Object,
    default: () => ({})
  },
  token: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['success', 'error']);

const formData = ref({ ...props.initialData });

watch(() => props.initialData, (newData) => {
  Object.assign(formData.value, newData);
}, { deep: true });
const loading = ref(false);
const message = ref('');
const error = ref(false);

const filteredProperties = computed(() => {
  const result = {};
  for (const [key, value] of Object.entries(props.schema.properties || {})) {
    if (!['id', 'firebase_uid', 'created_at', 'role'].includes(key)) {
      result[key] = value;
    }
  }
  return result;
});

const isRequired = (propName) => {
  return (props.schema.required || []).includes(propName);
};

const getInputType = (propName, propDetails) => {
  if (propName === 'email') return 'email';
  if (propName === 'password') return 'password';
  if (propDetails.format === 'date') return 'date';
  if (propDetails.type === 'string') return 'text';
  return 'text';
};

const handleSubmit = async () => {
  loading.value = true;
  message.value = '';
  error.value = false;

  try {
    const response = await fetch(props.action, {
      method: props.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${props.token}`
      },
      body: JSON.stringify(formData.value)
    });

    if (response.ok) {
      message.value = 'Saved successfully!';
      error.value = false;
      emit('success', await response.json());
    } else {
      const data = await response.json();
      message.value = data.message || 'Error saving data';
      error.value = true;
      emit('error', data);
    }
  } catch (err) {
    message.value = 'Failed to submit the form.';
    error.value = true;
    emit('error', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  // Update formData with initialData in case it arrives late
  Object.assign(formData.value, props.initialData);
});
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
.required {
  color: red;
}
input, select {
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
.error { color: red; }
.success { color: green; }
</style>
