import { Router } from 'express'
import productManager from '../dao/mongo/ProductsManager.js'

const router = Router()

const viewsProductsRouter = (io) => {

	router.get('/products', async (req, res) => {
		try{
			const { limit, page, sort, query } = req.query

			const products = await productManager.getProducts(limit, page, sort, query)

			let user = false
			if(req.session.user){
				user = req.session.user
			}

			res.render('products/products', { products, style: 'products',  user})
		} catch(error){
			res.render('errors/error', { error: error })
		}
	})

	router.get('/product/:pid', async (req, res) => {
		try{
			if(!req.params.pid) return

			const pid = req.params.pid
			const formatPid = pid.trim() 

			if(!formatPid) return 

			const product = await productManager.getProductById(formatPid)

			res.render('products/product', { product, style: 'product' })
		} catch(error){
			res.render('errors/error', { error: error })
		}
	})
	
	router.get('/realtimeproducts', async (req, res) => {
		try{
			const products = await productManager.getProducts()
			
			io.on('connection', (socket) => {
				io.emit('products', products)

				socket.on('addProduct', async (product) => {
					if(!product) return
					
					const { title, description, code, price, status, stock, category, thumbnails } = product
	
					await productManager.addProduct(title, description, code, price, status, stock, category, thumbnails)

					const updatedProducts = await productManager.getProducts()
					
					io.emit('products', updatedProducts)
				})

				socket.on('deleteProduct', async (pid) => {
					if(!pid) return
					const productId = pid.trim()
					if(!productId) return

					await productManager.deleteProduct(productId)

					const updatedProducts = await productManager.getProducts()

					io.emit('products',  updatedProducts)
				})

				socket.on('updateProduct', async (product) => {
					if(!product) return 
					
					const { pid, field, data} = product 
					
					await productManager.updateProduct(pid, field, data)
					const updatedProducts = await productManager.getProducts()
					
					io.emit('products', updatedProducts)
				})
			})
			res.render('admin/realTimeProducts')
		} catch(error){
			res.render('errors/error', { error: error })
		}
	})

	return router
}
	
export default viewsProductsRouter