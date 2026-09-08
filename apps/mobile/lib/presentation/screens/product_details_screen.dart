import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../data/repositories/product_repository.dart';
import '../../domain/entities/product.dart';

class ProductDetailsScreen extends StatefulWidget {
  final String productId;

  const ProductDetailsScreen({super.key, required this.productId});

  @override
  State<ProductDetailsScreen> createState() => _ProductDetailsScreenState();
}

class _ProductDetailsScreenState extends State<ProductDetailsScreen> {
  Product? _product;
  List<Deal> _deals = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final repo = context.read<ProductRepository>();
    final results = await Future.wait([repo.getById(widget.productId), repo.getDeals(widget.productId)]);
    setState(() {
      _product = results[0] as Product;
      _deals = results[1] as List<Deal>;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || _product == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final product = _product!;
    return Scaffold(
      appBar: AppBar(title: Text(product.title)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (product.isDemoData)
            Container(
              padding: const EdgeInsets.all(8),
              margin: const EdgeInsets.only(bottom: 8),
              color: Colors.amber.shade100,
              child: const Text('Demo data'),
            ),
          if (product.brand != null) Text('Brand: ${product.brand}'),
          if (product.price != null) Text('Price: ${product.currency ?? ''} ${product.price}'),
          if (product.rating != null) Text('Rating: ★ ${product.rating}'),
          const SizedBox(height: 16),
          Text('Deals', style: Theme.of(context).textTheme.titleMedium),
          if (_deals.isEmpty) const Text('No active deals right now.'),
          ..._deals.map((d) => Card(
                child: ListTile(
                  title: Text('${d.currency} ${d.price} at ${d.merchant}'),
                  subtitle: d.discountPercent != null ? Text('${d.discountPercent}% off') : null,
                ),
              )),
        ],
      ),
    );
  }
}
