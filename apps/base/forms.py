from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.forms import BaseInlineFormSet, inlineformset_factory

from .models import Book, BookSource, MealEntry, MealItem


class BookForm(forms.ModelForm):
    class Meta:
        model = Book
        fields = [
            'title',
            'author',
            'genre',
            'year',
            'number_of_pages',
            'status',
            'current_page',
            'started_on',
            'language',
            'cover',
            'notes',
        ]
        widgets = {
            'year': forms.NumberInput(attrs={'min': 0}),
            'number_of_pages': forms.NumberInput(attrs={'min': 1}),
            'current_page': forms.NumberInput(attrs={'min': 0}),
            'started_on': forms.DateInput(attrs={'type': 'date'}),
            'notes': forms.Textarea(attrs={'rows': 3}),
            'status': forms.RadioSelect,
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['status'].initial = 'NR'
        self.fields['status'].required = False

    def clean(self):
        cleaned_data = super().clean()
        total_pages = cleaned_data.get('number_of_pages')
        current_page = cleaned_data.get('current_page') or 0

        if total_pages is not None and current_page > total_pages:
            self.add_error('current_page', 'The current page cannot exceed the total number of pages.')

        return cleaned_data


class BookSourceForm(forms.ModelForm):
    class Meta:
        model = BookSource
        fields = ['format', 'location', 'url']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


BookSourceFormSet = inlineformset_factory(
    Book,
    BookSource,
    form=BookSourceForm,
    fields=['format', 'location', 'url'],
    extra=1,
    can_delete=True,
)


class MealEntryForm(forms.ModelForm):
    tags = forms.MultipleChoiceField(
        choices=MealEntry.TAG_OPTIONS,
        required=False,
        widget=forms.CheckboxSelectMultiple,
    )

    class Meta:
        model = MealEntry
        fields = ['category', 'date', 'time', 'photo', 'tags']
        labels = {
            'category': 'Meal type',
            'date': 'Date',
            'time': 'Time',
            'photo': 'Photo',
            'tags': 'Tags',
        }
        widgets = {
            'category': forms.RadioSelect,
            'date': forms.DateInput(attrs={'type': 'date'}),
            'time': forms.TimeInput(attrs={'type': 'time'}),
        }


class MealItemForm(forms.ModelForm):
    class Meta:
        model = MealItem
        fields = ['name']
        labels = {'name': 'Food'}
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': 'E.g., rice and beans'}),
        }


class BaseMealItemFormSet(BaseInlineFormSet):
    def clean(self):
        super().clean()
        if any(self.errors):
            return

        has_item = any(
            form.cleaned_data.get('name') and not form.cleaned_data.get('DELETE', False)
            for form in self.forms
            if form.cleaned_data
        )
        if not has_item:
            raise ValidationError('Add at least one food item to the meal.')


MealItemFormSet = inlineformset_factory(
    MealEntry,
    MealItem,
    form=MealItemForm,
    formset=BaseMealItemFormSet,
    fields=['name'],
    extra=1,
    can_delete=True,
)


class BookProgressForm(forms.Form):
    current_page = forms.IntegerField(min_value=0)


class Signup(UserCreationForm):
    username = forms.CharField(max_length=15)
    email = forms.EmailField(required=True)
    password1 = forms.CharField(widget=forms.PasswordInput)
    password2 = forms.CharField(widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['username'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Username'
        })

        self.fields['email'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Email'
        })

        self.fields['password1'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Password'
        })

        self.fields['password2'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Confirm password'
        })
