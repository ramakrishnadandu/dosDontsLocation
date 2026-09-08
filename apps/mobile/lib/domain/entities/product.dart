class Product {
  final String id;
  final String title;
  final String? brand;
  final double? price;
  final String? currency;
  final double? rating;
  final bool isDemoData;

  const Product({
    required this.id,
    required this.title,
    required this.brand,
    required this.price,
    required this.currency,
    required this.rating,
    required this.isDemoData,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] as String,
      title: json['title'] as String,
      brand: json['brand'] as String?,
      price: (json['price'] as num?)?.toDouble(),
      currency: json['currency'] as String?,
      rating: (json['rating'] as num?)?.toDouble(),
      isDemoData: json['isDemoData'] as bool? ?? false,
    );
  }
}

class Deal {
  final String id;
  final String merchant;
  final double price;
  final double? originalPrice;
  final double? discountPercent;
  final String currency;

  const Deal({
    required this.id,
    required this.merchant,
    required this.price,
    required this.originalPrice,
    required this.discountPercent,
    required this.currency,
  });

  factory Deal.fromJson(Map<String, dynamic> json) {
    return Deal(
      id: json['id'] as String,
      merchant: json['merchant'] as String,
      price: (json['price'] as num).toDouble(),
      originalPrice: (json['originalPrice'] as num?)?.toDouble(),
      discountPercent: (json['discountPercent'] as num?)?.toDouble(),
      currency: json['currency'] as String,
    );
  }
}
