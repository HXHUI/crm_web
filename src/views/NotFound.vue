<template>
  <div class="not-found">
    <div class="not-found-content">
      <div class="not-found-icon">
        <el-icon><Warning /></el-icon>
      </div>
      <h1 class="not-found-title">404</h1>
      <p class="not-found-description">抱歉，您访问的页面不存在</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/dashboard')
}
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.not-found-content {
  text-align: center;
  color: white;
}

.not-found-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.not-found-title {
  font-size: 72px;
  font-weight: bold;
  margin: 0 0 16px 0;
}

.not-found-description {
  font-size: 18px;
  margin: 0 0 32px 0;
  opacity: 0.8;
}
</style>
