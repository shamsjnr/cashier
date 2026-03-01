<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/categories', [
            'categories' => Category::withCount('items')->orderBy('sort_order')->orderBy('name')->paginate(25),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:2',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'sort_order' => 'nullable|integer',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        Category::create($validated);

        return back()->with('status', 'success');
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:2',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'sort_order' => 'nullable|integer',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        $category->update($validated);

        return back()->with('status', 'success');
    }

    public function destroy(Category $category)
    {
        $category->delete();
        return back()->with('status', 'success');
    }
}
