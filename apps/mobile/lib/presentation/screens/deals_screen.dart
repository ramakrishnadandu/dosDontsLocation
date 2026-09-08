import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../data/repositories/product_repository.dart';
import '../../domain/entities/product.dart';

/// Section 16: Deal Engine UI. There is no "browse all deals" endpoint
/// today (deals are looked up per product) - this screen searches products
/// and shows each one's currently-active deals inline. Expired deals are
/// never returned by the API (see packages/contracts/src/product.ts#isDealActive),
/// so anything shown here is guaranteed live.
class DealsScreen extends StatefulWidget {
  const DealsScreen({super.key});

  @override
  State<DealsScreen> createState() => _DealsScreenState();
}

class _DealsScreenState extends State<DealsScreen> {
  final _controller = TextEditingController();
  final Map<String, List<Deal>> _dealsByProduct = {};
  List<Product> _products = [];
  bool _loading = false;

  Future<void> _search(String query) async {
    setState(() => _loading = true);
    final repo = context.read<ProductRepository>();
    _products = await repo.search(query);
    for (final product in _products) {
      _dealsByProduct[product.id] = await repo.getDeals(product.id);
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _controller,
          decoration: const InputDecoration(hintText: 'Search products for deals', border: InputBorder.none),
          onSubmitted: _search,
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              children: _products.map((p) {
                final deals = _dealsByProduct[p.id] ?? [];
                if (deals.isEmpty) return const SizedBox.shrink();
                return Card(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ListTile(title: Text(p.title)),
                      ...deals.map((d) => ListTile(
                            dense: true,
                            title: Text('${d.currency} ${d.price} at ${d.merchant}'),
                            trailing: d.discountPercent != null ? Text('${d.discountPercent}% off') : null,
                          )),
                    ],
                  ),
                );
              }).toList(),
            ),
    );
  }
}
