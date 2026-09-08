import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../data/repositories/product_repository.dart';
import '../../domain/entities/product.dart';
import 'product_details_screen.dart';
import 'product_comparison_screen.dart';

class ProductSearchScreen extends StatefulWidget {
  const ProductSearchScreen({super.key});

  @override
  State<ProductSearchScreen> createState() => _ProductSearchScreenState();
}

class _ProductSearchScreenState extends State<ProductSearchScreen> {
  final _controller = TextEditingController();
  List<Product> _results = [];
  final Set<String> _selectedForComparison = {};
  bool _loading = false;

  Future<void> _search(String query) async {
    setState(() => _loading = true);
    try {
      _results = await context.read<ProductRepository>().search(query);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _controller,
          decoration: const InputDecoration(hintText: 'Search products', border: InputBorder.none),
          onSubmitted: _search,
        ),
        actions: [
          if (_selectedForComparison.length >= 2)
            TextButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => ProductComparisonScreen(productIds: _selectedForComparison.toList())),
              ),
              child: const Text('Compare'),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _results.length,
              itemBuilder: (context, index) {
                final product = _results[index];
                final selected = _selectedForComparison.contains(product.id);
                return ListTile(
                  leading: Checkbox(
                    value: selected,
                    onChanged: (v) => setState(() {
                      if (v == true) {
                        _selectedForComparison.add(product.id);
                      } else {
                        _selectedForComparison.remove(product.id);
                      }
                    }),
                  ),
                  title: Text(product.title),
                  subtitle: Text([
                    if (product.brand != null) product.brand!,
                    if (product.price != null) '${product.currency ?? ''} ${product.price}',
                    if (product.isDemoData) 'Demo data',
                  ].join(' · ')),
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => ProductDetailsScreen(productId: product.id)),
                  ),
                );
              },
            ),
    );
  }
}
