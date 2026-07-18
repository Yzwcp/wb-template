// src/hooks/useUploadFile.js
import {
	ref
} from 'vue'
import {
	useUpload
} from 'wot-design-uni'
import {
	useGlobalStore
} from '../store/global'
import {
	uploadBaseUrl
} from '../utils/config'
// 引入OSS相关依赖（根据你的项目路径调整）
import {
	getFileDirect
} from '../api/index.js'
import {
	generateSimpleUUID,
	getFileExtension
} from '../utils/tools.js'

/**
 * 通用文件上传 Hook（支持普通上传/阿里云OSS上传）
 * @param {Object} options - 上传配置项
 * @param {string} [options.classify='temp'] - 文件分类（普通上传用）
 * @param {boolean} [options.useOss=false] - 是否使用阿里云OSS上传
 * @param {Function} options.onSuccess - 上传成功回调 (filePath) => void
 * @param {Function} [options.onError] - 上传失败回调 (err) => void
 * @param {Function} [options.onProgress] - 上传进度回调 (progress) => void
 * @returns {Object} { handleUpload, files } - 上传方法 + 文件列表响应式数据
 */
export function useUploadFile(options) {
	const {
		startUpload,
		chooseFile,
		UPLOAD_STATUS
	} = useUpload()
	const {
		token
	} = useGlobalStore()
	const files = ref([]) // 新增：存储选择的文件列表
	const ossConfig = ref({})
	const ossHost = ref('')

	// 默认配置
	const defaultOptions = {
		classify: 'temp',
		useOss: false,
		accept: 'image',
		multiple: false,
		maxCount: 1,
		onSuccess: () => {},
		onError: (err) => {
			console.log('上传失败', err)
			uni.showToast({
				title: '上传失败',
				icon: 'none'
			})
		},
		onProgress: (progress) => console.log('上传进度', progress)
	}

	// 合并配置
	const finalOptions = {
		...defaultOptions,
		...options
	}

	// 初始化OSS配置（仅OSS上传时调用）
	const initOssConfig = async () => {
		try {
			const data = await getFileDirect()
			ossHost.value = data.host
			ossConfig.value = data
			return data
		} catch (err) {
			finalOptions.onError('OSS配置获取失败：' + err.message)
			throw err
		}
	}

	// 构建OSS上传的FormData
	const buildOssFormData = (file) => {
		return new Promise((resolve) => {
			if (!file || !file.path) {
				resolve({})
				return
			}
			const imageName = generateSimpleUUID().replaceAll('-', '')
			const key = `uploads/avatar/${imageName}.${getFileExtension(file.path)}`
			const formData = {
				key,
				OSSAccessKeyId: ossConfig.value.accessid,
				policy: ossConfig.value.policy,
				signature: ossConfig.value.signature,
				success_action_status: '200'
			}
			console.log(formData);
			resolve(formData)
		})
	}

	// 普通上传逻辑
	const handleNormalUpload = async (filePath) => {
		startUpload({
			url: filePath,
			status: UPLOAD_STATUS.PENDING,
			percent: 0
		}, {
			action: uploadBaseUrl,
			header: {
				Authorization: `Bearer ${token}`
			},
			formData: {
				classify: finalOptions.classify
			},
			onSuccess(res) {
				try {
					const data = JSON.parse(res.data)
					finalOptions.onSuccess(data.data.fullPath)
				} catch (parseErr) {
					finalOptions.onError('响应数据解析失败：' + parseErr.message)
				}
			},
			onError: finalOptions.onError,
			onProgress: finalOptions.onProgress
		})
	}

	// OSS上传逻辑
	const handleOssUpload = async (file) => {
		await initOssConfig()
		const formData = await buildOssFormData(file)
		if (!formData.key) {
			finalOptions.onError('OSS表单构建失败')
			return
		}

		startUpload({
			url: file.path, // OSS上传用file.url（临时路径）
			status: UPLOAD_STATUS.PENDING,
			percent: 0
		}, {
			action: ossHost.value,
			header: {}, // OSS上传不需要token
			formData,
			onSuccess() {
				// OSS上传成功后拼接完整路径
				const filePath = `${ossHost.value}/${formData.key}`
				finalOptions.onSuccess(filePath)
			},
			onError: finalOptions.onError,
			onProgress: finalOptions.onProgress
		})
	}

	// 核心上传方法（修复filePath undefined问题）
	const handleUpload = async (tempPath) => {
		try {
			let targetFile = null
			let filePath = tempPath

			// 1. 如果未传入tempPath，选择文件
			if (!tempPath) {
				const chooseRes = await chooseFile({
					accept: finalOptions.accept,
					multiple: finalOptions.multiple,
					maxCount: finalOptions.maxCount
				})
				// 边界判断：未选择文件直接返回
				if (!chooseRes || chooseRes.length === 0) {
					finalOptions.onError('未选择任何文件')
					return
				}
				// 修复：正确接收选择的文件列表
				targetFile = chooseRes[0]
				filePath = targetFile.path || targetFile.url
				files.value = chooseRes // 更新文件列表
			}

			// 2. 边界判断：filePath仍为空
			if (!filePath) {
				finalOptions.onError('文件路径为空')
				return
			}
			console.log(targetFile);
			// 3. 区分上传方式
			if (finalOptions.useOss) {
				await handleOssUpload(targetFile || {
					path: filePath
				})
			} else {
				await handleNormalUpload(filePath)
			}
		} catch (err) {
			finalOptions.onError(err)
		}
	}

	return {
		handleUpload,
		files
	}
}