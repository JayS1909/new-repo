import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const productSchema = new mongoose.Schema({
    sku: {
        type: String, 
        unique: true
    },
    variantID:{
        type: String,
        unique: true
    },
    productName: {
        type: String,
        required: true,
        trim: true  
    },
    images: {
        type: [String],
        required: true,
        validate: {
            validator: function(v) {
                return v.length === 4;
            },
            message: 'There must be exactly 4 images'
        }
    },
    originalPrice: {
        type: Number,
        required: true
    },
    discountedPrice: {
        type: Number
    },
    discountedPercentage: {
        type: Number,
        min: [0, 'Discount percentage must be at least 0'],
        max: [100, 'Discount percentage must be at most 100']
    },
    sizes: {
        type: Map,
        of: Number,
        required: true
    },
    details: {
        type: Map,
        of: String,
        required: true
    },
    description: {
        frontPrint: {type:String},
        backPrint: {type: String},
        features: [String]
    },
    quantity: {
        type: Number, 
        min: [0, 'Quantity cannot be negative']
    },
    views: {
        type: Number,
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    category: {
        type: String,
        enum: [
            'Oversized T-Shirts',
            'Oversized Shirts',
            'Shirts',
            'T-Shirts',
            'Hoodies',
            'Sweatshirts',
            'Cargo Pants',
            'Joggers',
            'Jeans',
            'Jackets',
            'Co-Ord Sets',
            'Accessories'
        ],
        required: true
    },
    collectionTheme: {
        type: String,
        enum: [
            'Anime',
            'Acid Wash',
            'Minimal',
            'Graphic',
            'Typography',
            'Vintage Wash',
            'Premium Essentials',
            'New Arrivals',
            'Best Sellers',
            'Limited Drops',
            'General'
        ],
        default: 'General'
    },
    fit: {
        type: String,
        enum: ['Oversized', 'Regular', 'Slim', 'Relaxed']
    },
    material: {
        type: String
    },
    color: {
        type: String
    },
    ratings: {
         type: [Number],
         default: []
    }
},{timestamps:true});

productSchema.virtual('calculatedDiscountedPrice').get(function() {
    if (this.discountedPercentage) {
        return this.originalPrice - (this.originalPrice * (this.discountedPercentage/100));
    }
    return this.originalPrice;
});

productSchema.pre('save', function(next) {
    if (this.discountedPercentage) {
        this.discountedPrice = this.calculatedDiscountedPrice;
    } else {
        this.discountedPrice = this.originalPrice;
    }
    next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;